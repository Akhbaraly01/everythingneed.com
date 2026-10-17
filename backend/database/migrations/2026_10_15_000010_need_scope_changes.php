<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * TODO 15 fulfillment: material scope changes are proposed, decided by the
 * counterparty, and preserved — never silently applied. An accepted price
 * effect becomes the agreed override the payout reads; the original offer
 * price row is never rewritten.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('need_scope_changes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('need_request_id')->index();
            $table->uuid('requested_by')->index();
            $table->text('summary');
            $table->decimal('price_effect', 12, 2)->nullable();
            $table->string('time_effect', 255)->nullable();
            $table->string('status', 20)->default('proposed')->index();
            $table->uuid('decided_by')->nullable();
            $table->timestamp('decided_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->foreign('need_request_id')->references('id')->on('need_requests')->cascadeOnDelete();
        });

        Schema::table('need_requests', function (Blueprint $table) {
            $table->decimal('agreed_price_override', 12, 2)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('need_requests', function (Blueprint $table) {
            $table->dropColumn('agreed_price_override');
        });

        Schema::dropIfExists('need_scope_changes');
    }
};
