<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * TODO 06 guided request creation: pricing basis, structured location,
 * timing options, and visibility (public vs invitation-only with a real
 * enforcement rule, not a label).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('need_requests', function (Blueprint $table) {
            $table->string('pricing_basis', 20)->default('flexible')->index();
            $table->boolean('is_remote')->default(false);
            $table->string('state', 120)->nullable();
            $table->string('lga', 120)->nullable();
            $table->string('city', 120)->nullable();
            $table->boolean('is_asap')->default(false);
            $table->string('preferred_time_window', 120)->nullable();
            $table->string('visibility', 20)->default('public')->index();
            $table->json('invited_provider_ids')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('need_requests', function (Blueprint $table) {
            $table->dropColumn([
                'pricing_basis', 'is_remote', 'state', 'lga', 'city',
                'is_asap', 'preferred_time_window', 'visibility',
                'invited_provider_ids',
            ]);
        });
    }
};
