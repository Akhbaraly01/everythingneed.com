<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * N-37 scheduled rides: riders may book a ride for a future time. The
 * column is nullable — immediate rides (the default) are unchanged.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rides', function (Blueprint $table) {
            $table->timestamp('scheduled_for')->nullable()->after('duration_minutes');
        });
    }

    public function down(): void
    {
        Schema::table('rides', function (Blueprint $table) {
            $table->dropColumn('scheduled_for');
        });
    }
};
