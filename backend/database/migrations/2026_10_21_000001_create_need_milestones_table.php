<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * N-20 milestone escrow ledger.
 *
 * A request can be split into milestones; each milestone is funded into
 * escrow by the owner and released to the provider individually. The
 * funding Payment row is the platform-held escrow (the provider is only
 * credited on release), so the ledger mirrors the money, it never holds
 * a second copy of it.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('need_milestones')) {
            return;
        }

        Schema::create('need_milestones', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('need_request_id')->index();
            $table->uuid('offer_id')->nullable()->index();
            $table->string('title');
            $table->text('description')->nullable();
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('USD');
            $table->unsignedInteger('sequence')->default(1);
            $table->string('status', 20)->default('pending')->index();
            // The escrow funding payment (platform-held) and the release
            // payment (provider credited). Both point at payments.id.
            $table->uuid('payment_id')->nullable();
            $table->uuid('payout_payment_id')->nullable();
            $table->uuid('created_by');
            $table->timestamp('funded_at')->nullable();
            $table->timestamp('released_at')->nullable();
            $table->timestamp('refunded_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['need_request_id', 'sequence'], 'need_milestones_request_sequence_unique');
            $table->index(['need_request_id', 'status'], 'need_milestones_request_status_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('need_milestones');
    }
};
