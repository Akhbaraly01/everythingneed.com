<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * N-23 vetting trial stage (Toptal-style funnel: screening → trial →
 * verified badge). trial marks the provisional operating window an admin
 * starts after screening; trial providers stay out of verified categories
 * and out of auto-matching until approved.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('need_provider_profiles', function (Blueprint $table) {
            $table->timestamp('trial_started_at')->nullable()->after('reviewed_at');
        });
    }

    public function down(): void
    {
        Schema::table('need_provider_profiles', function (Blueprint $table) {
            $table->dropColumn('trial_started_at');
        });
    }
};
