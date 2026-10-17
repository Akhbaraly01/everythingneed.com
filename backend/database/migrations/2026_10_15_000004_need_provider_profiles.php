<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * TODO 08 provider onboarding + verification.
 * need_provider_profiles is the platform-approval record: identity comes
 * from KYC (KycGate, never duplicated here), qualifications/evidence ride
 * along for reviewer eyes only, and status gates offer eligibility where
 * the category demands it. Categories opt into verification per category.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('need_provider_profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->unique();
            $table->string('display_name', 120);
            $table->text('bio')->nullable();
            $table->json('category_ids')->nullable();
            $table->json('service_areas')->nullable();
            $table->json('qualifications')->nullable();
            $table->json('evidence_urls')->nullable();
            $table->string('status', 20)->default('draft')->index();
            $table->text('review_note')->nullable();
            $table->uuid('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::table('need_categories', function (Blueprint $table) {
            $table->boolean('requires_verified_provider')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('need_categories', function (Blueprint $table) {
            $table->dropColumn('requires_verified_provider');
        });

        Schema::dropIfExists('need_provider_profiles');
    }
};
