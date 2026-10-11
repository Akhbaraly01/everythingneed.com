<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Wallet transaction idempotency: same wallet + reference only once.
        Schema::table('wallet_transactions', function (Blueprint $table) {
            $table->unique(['wallet_id', 'reference'], 'wallet_transactions_wallet_reference_unique');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->string('idempotency_key')->nullable()->unique('payments_idempotency_key_unique');
            $table->json('metadata')->nullable();
            $table->string('provider')->nullable();
            $table->string('provider_payment_id')->nullable();
            $table->index(['provider', 'provider_payment_id'], 'payments_provider_payment_id_index');
        });

        // Allow legacy 'completed' rows alongside canonical 'succeeded'.
        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            DB::statement(<<<'SQL'
DO $$
DECLARE
    cname text;
BEGIN
    SELECT conname INTO cname
    FROM pg_constraint
    WHERE conrelid = 'payments'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%status%';
    IF cname IS NOT NULL THEN
        EXECUTE format('ALTER TABLE payments DROP CONSTRAINT %I', cname);
    END IF;
END $$;
SQL);
            DB::statement(
                "ALTER TABLE payments ADD CONSTRAINT payments_status_check CHECK (status IN ('pending','processing','succeeded','completed','failed','refunded','partially_refunded'))"
            );
        }

        // Expand refunds status to include gateway outcomes.
        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            // Drop whatever CHECK exists on refunds.status, then re-add the expanded set.
            DB::statement(<<<'SQL'
DO $$
DECLARE
    cname text;
BEGIN
    SELECT conname INTO cname
    FROM pg_constraint
    WHERE conrelid = 'refunds'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%status%';
    IF cname IS NOT NULL THEN
        EXECUTE format('ALTER TABLE refunds DROP CONSTRAINT %I', cname);
    END IF;
END $$;
SQL);
            DB::statement(
                "ALTER TABLE refunds ADD CONSTRAINT refunds_status_check CHECK (status IN ('pending','approved','rejected','completed','succeeded','failed'))"
            );
        }

        // Gateway raw response on refunds (driver payload / error).
        if (!Schema::hasColumn('refunds', 'gateway_response')) {
            Schema::table('refunds', function (Blueprint $table) {
                $table->json('gateway_response')->nullable();
            });
        }

        // Canonical vendor payout vocabulary: pending | paid | rejected
        // (legacy 'completed' rows remain readable; writers use 'paid').
        if (!Schema::hasTable('kyc_verifications')) {
            Schema::create('kyc_verifications', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('user_id');
                $table->string('status')->default('pending'); // pending|submitted|approved|rejected
                $table->string('document_type')->nullable();
                $table->string('document_number')->nullable();
                $table->string('document_front_path')->nullable();
                $table->string('document_back_path')->nullable();
                $table->text('rejection_reason')->nullable();
                $table->timestamp('submitted_at')->nullable();
                $table->timestamp('reviewed_at')->nullable();
                $table->uuid('reviewed_by')->nullable();
                $table->timestamps();
                $table->softDeletes();
                $table->index(['user_id', 'status']);
            });
        }

        if (!Schema::hasTable('wallet_holds')) {
            Schema::create('wallet_holds', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('wallet_id');
                $table->decimal('amount', 12, 2);
                $table->string('status')->default('active'); // active|released|captured
                $table->string('reference')->unique();
                $table->string('reason')->nullable();
                $table->uuid('order_id')->nullable();
                $table->timestamp('expires_at')->nullable();
                $table->timestamp('released_at')->nullable();
                $table->timestamps();
                $table->index(['wallet_id', 'status']);
            });
        }

        if (!Schema::hasTable('payment_webhook_events')) {
            Schema::create('payment_webhook_events', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('provider');
                $table->string('event_id')->unique();
                $table->string('event_type')->nullable();
                $table->uuid('payment_id')->nullable();
                $table->json('payload')->nullable();
                $table->string('status')->default('received'); // received|processed|ignored|failed
                $table->text('error')->nullable();
                $table->timestamp('received_at')->nullable();
                $table->timestamp('processed_at')->nullable();
                $table->timestamps();
                $table->index(['provider', 'status']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_webhook_events');
        Schema::dropIfExists('wallet_holds');
        Schema::dropIfExists('kyc_verifications');

        Schema::table('payments', function (Blueprint $table) {
            $table->dropUnique('payments_idempotency_key_unique');
            $table->dropIndex('payments_provider_payment_id_index');
            $table->dropColumn(['idempotency_key', 'metadata', 'provider', 'provider_payment_id']);
        });

        Schema::table('wallet_transactions', function (Blueprint $table) {
            $table->dropUnique('wallet_transactions_wallet_reference_unique');
        });
    }
};
