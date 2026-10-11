<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * W1.5 — per-user permission grants layered on top of the role matrix.
 *
 * A user's effective permission = (any held role's role_permissions rows)
 * ∪ (rows in user_permissions). Grants are validated against
 * PermissionSeeder::CATALOG and cached per user (user.permissions.{id}).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('user_permissions')) {
            return;
        }

        Schema::create('user_permissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->string('permission', 80);
            $table->uuid('granted_by')->nullable();
            $table->string('note', 255)->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'permission']);
            $table->index('permission');

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_permissions');
    }
};
