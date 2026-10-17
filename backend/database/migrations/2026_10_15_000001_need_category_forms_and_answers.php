<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * TODO 05 category + dynamic-form system.
 * Visibility is governed by is_active, and rows with live references cannot
 * be removed (deactivate instead). Soft deletes apply via the base model.
 * form_schema is a validated, allowlisted field list (never code); requests
 * snapshot the schema they were submitted under so form changes never
 * invalidate historical submissions.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('need_categories', function (Blueprint $table) {
            $table->uuid('parent_id')->nullable()->index();
            $table->boolean('is_active')->default(true)->index();
            $table->json('form_schema')->nullable();
            $table->unsignedInteger('form_schema_version')->default(1);
            $table->timestamp('updated_at')->nullable();
        });

        Schema::table('need_requests', function (Blueprint $table) {
            $table->json('answers')->nullable();
            $table->json('form_schema_snapshot')->nullable();
            $table->unsignedInteger('form_schema_version')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('need_requests', function (Blueprint $table) {
            $table->dropColumn(['answers', 'form_schema_snapshot', 'form_schema_version']);
        });

        Schema::table('need_categories', function (Blueprint $table) {
            $table->dropColumn(['parent_id', 'is_active', 'form_schema', 'form_schema_version', 'updated_at']);
        });
    }
};
