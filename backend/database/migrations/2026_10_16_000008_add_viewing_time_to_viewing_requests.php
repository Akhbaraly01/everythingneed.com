<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * N-43 viewing tour slots: viewing requests gain a time-of-day slot so
 * owners can run conflict-free tour calendars. The entity previously
 * listed preferred_date/preferred_time in fillable, but no migration
 * ever created those columns — they are removed alongside this addition.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('viewing_requests', function (Blueprint $table) {
            $table->time('viewing_time')->nullable()->after('viewing_date');
        });
    }

    public function down(): void
    {
        Schema::table('viewing_requests', function (Blueprint $table) {
            $table->dropColumn('viewing_time');
        });
    }
};
