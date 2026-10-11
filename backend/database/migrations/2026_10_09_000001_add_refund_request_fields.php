<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Gap 3 (spec 31/32): a refund is REQUESTED first (pending row, no money
 * moves) and only processed after support reviews it. The row records who
 * asked, who decided, and the original payment method so processing refunds
 * via the same method the customer paid with.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('refunds', function (Blueprint $table): void {
            $table->uuid('requested_by')->nullable()->after('payment_id');
            $table->uuid('reviewed_by')->nullable()->after('requested_by');
            // Same-method snapshot: the payment method the money goes back to.
            $table->string('method')->nullable()->after('amount');
            $table->string('idempotency_key')->nullable()->after('method');
            // Source entity that raised the request (return request, order, ...).
            $table->string('cancellation_id')->nullable()->after('idempotency_key');
            $table->timestamp('requested_at')->nullable()->after('reason');
            $table->timestamp('reviewed_at')->nullable()->after('requested_at');
            $table->text('rejection_reason')->nullable()->after('reviewed_at');

            // Unique when set; PostgreSQL allows repeated NULLs.
            $table->unique('idempotency_key');
        });
    }

    public function down(): void
    {
        Schema::table('refunds', function (Blueprint $table): void {
            $table->dropUnique(['idempotency_key']);
            $table->dropColumn([
                'requested_by',
                'reviewed_by',
                'method',
                'idempotency_key',
                'cancellation_id',
                'requested_at',
                'reviewed_at',
                'rejection_reason',
            ]);
        });
    }
};
