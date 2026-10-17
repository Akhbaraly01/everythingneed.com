<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * P0 admin needs console: needs/task-scoped disputes + fraud-flag queue.
 * Dispute rows stay in the shared disputes table (order flow untouched);
 * fraud flags are new, needs-scoped, and human-reviewed only.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('disputes', function (Blueprint $table) {
            $table->uuid('need_request_id')->nullable()->index();
            $table->uuid('task_id')->nullable()->index();
        });

        Schema::create('fraud_flags', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('rule', 60)->index();
            $table->string('entity_type', 40);
            $table->string('entity_id');
            $table->uuid('user_id')->nullable()->index();
            $table->json('details')->nullable();
            $table->string('status', 20)->default('open')->index();
            $table->uuid('decided_by')->nullable();
            $table->text('decision_note')->nullable();
            $table->timestamp('decided_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            // One open flag per rule+entity: re-scans refresh, never duplicate.
            $table->unique(['rule', 'entity_type', 'entity_id', 'status'], 'fraud_flags_rule_entity_status_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fraud_flags');

        Schema::table('disputes', function (Blueprint $table) {
            $table->dropColumn(['need_request_id', 'task_id']);
        });
    }
};
