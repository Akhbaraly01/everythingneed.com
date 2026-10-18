<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Mega-phase M-1: first-class service taxonomy (roots + subcategories
        // + icons) for the admin-defined service catalogue (spec 39/100),
        // mirroring the needs taxonomy contract.
        Schema::create('service_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 120);
            $table->string('slug', 120)->unique();
            $table->string('description', 2000)->nullable();
            $table->string('icon', 60)->nullable();
            $table->string('color', 20)->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->uuid('parent_id')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('sort_order');
            $table->index('is_active');
        });

        // The self-referencing FK must be added after the CREATE statement:
        // Laravel's Postgres grammar appends "add primary key" after inline
        // foreign keys, and Postgres rejects the FK until the PK exists.
        Schema::table('service_categories', function (Blueprint $table) {
            $table->foreign('parent_id')->references('id')->on('service_categories')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_categories');
    }
};
