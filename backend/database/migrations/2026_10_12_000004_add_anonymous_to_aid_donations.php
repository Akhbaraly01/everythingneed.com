<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Phase 5: donor unlinkability. Anonymous donations render as
     * "Anonymous" to the public; the donor link stays server-side for
     * receipts, refunds, and staff moderation.
     */
    public function up(): void
    {
        Schema::table('aid_donations', function (Blueprint $table) {
            $table->boolean('is_anonymous')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('aid_donations', function (Blueprint $table) {
            $table->dropColumn('is_anonymous');
        });
    }
};
