<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Optional evidence images (uploader-produced URLs only, never raw
     * client strings): aid-request injury/disease photos and appointment
     * injury/prescription screenshots.
     */
    public function up(): void
    {
        Schema::table('aid_requests', function (Blueprint $table) {
            $table->json('images')->nullable();
        });

        Schema::table('health_tickets', function (Blueprint $table) {
            $table->json('images')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('health_tickets', function (Blueprint $table) {
            $table->dropColumn('images');
        });

        Schema::table('aid_requests', function (Blueprint $table) {
            $table->dropColumn('images');
        });
    }
};
