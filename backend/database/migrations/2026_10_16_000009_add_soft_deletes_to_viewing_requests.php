<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * viewing_requests was created after the bulk soft-deletes migration
 * (2026_01_01_000021) and never received the column, but the base Model
 * uses SoftDeletes — every ViewingRequest query currently SQL-errors.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('viewing_requests', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('viewing_requests', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
