<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Admin-defined roles layered on top of the canonical AppRole enum.
 * Slug is the join key used by role_permissions / user_roles /
 * permission_scopes, so it stays within the 40-char role column budget.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('custom_roles')) {
            return;
        }

        Schema::create('custom_roles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('slug', 40)->unique();
            $table->string('name', 60);
            $table->string('description', 255)->nullable();
            $table->uuid('created_by')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('custom_roles');
    }
};
