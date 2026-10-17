<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * N-31 saved-search alerts: track when a saved search last fired so the
 * scheduler only notifies about requests created after that point (never
 * re-alerting the same row). `alert_cursor` stores the last-seen request
 * created_at as an ISO string for cheap `where created_at > cursor` scans.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('need_saved_items', function (Blueprint $table) {
            $table->timestamp('last_alerted_at')->nullable()->after('query');
            $table->string('alert_cursor', 40)->nullable()->after('last_alerted_at');
        });
    }

    public function down(): void
    {
        Schema::table('need_saved_items', function (Blueprint $table) {
            $table->dropColumn(['last_alerted_at', 'alert_cursor']);
        });
    }
};