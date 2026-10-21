<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * N-25 hourly timesheet ledger.
 *
 * For hourly-priced work the provider logs time per day; the owner
 * approves an entry and pays the approved hours. One entry per provider
 * per day keeps a replayed submission from double-billing.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('need_timesheets')) {
            return;
        }

        Schema::create('need_timesheets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('need_request_id')->index();
            $table->uuid('provider_id')->index();
            $table->date('work_date');
            $table->unsignedInteger('minutes');
            $table->decimal('hourly_rate', 12, 2);
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('USD');
            $table->text('note')->nullable();
            $table->string('status', 20)->default('submitted')->index();
            $table->uuid('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->uuid('payment_id')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(
                ['need_request_id', 'provider_id', 'work_date'],
                'need_timesheets_request_provider_date_unique'
            );
            $table->index(['need_request_id', 'status'], 'need_timesheets_request_status_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('need_timesheets');
    }
};
