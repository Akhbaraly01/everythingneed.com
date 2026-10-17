<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The subscription flow always intended per-plan durations
     * (`SubscriptionController::subscribe` consumed `duration_days`) but
     * the column never existed - subscriptions silently got no end date.
     */
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->unsignedSmallInteger('duration_days')->default(30)->after('interval');
        });
    }

    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn('duration_days');
        });
    }
};
