<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * N-32 company profiles: an employer's own page (public /companies/{slug})
 * that job posts attach to. job_posts.company_id is a nullable link — the
 * free-text `company` string stays authoritative for search/back-compat.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->index();
            $table->string('name', 120);
            $table->string('slug', 140)->unique();
            $table->string('logo_path', 500)->nullable();
            $table->text('description')->nullable();
            $table->string('website', 255)->nullable();
            $table->string('industry', 120)->nullable();
            $table->string('company_size', 50)->nullable();
            $table->string('location', 255)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::table('job_posts', function (Blueprint $table) {
            $table->uuid('company_id')->nullable()->after('company')->index();
        });
    }

    public function down(): void
    {
        Schema::table('job_posts', function (Blueprint $table) {
            $table->dropColumn('company_id');
        });

        Schema::dropIfExists('companies');
    }
};
