<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave B - no-code platform schema (spec S40-S47, S105-S106).
 *
 * Everything an administrator creates without code lives here: CMS blocks,
 * page revisions, navigation trees, dynamic forms, the media library and
 * admin-defined modules. All identifiers are UUIDv7 (time-ordered) so primary
 * keys stay index-friendly at platform scale (spec S70).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cms_blocks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('page_id');
            $table->string('type', 64);
            $table->jsonb('data');
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_visible')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('page_id')->references('id')->on('cms_pages')->onDelete('cascade');
            $table->index(['page_id', 'sort_order']);
            $table->index(['page_id', 'is_visible']);
        });

        Schema::create('cms_revisions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('page_id');
            $table->unsignedInteger('version');
            $table->jsonb('snapshot');
            $table->string('note', 255)->nullable();
            $table->uuid('created_by')->nullable();
            $table->timestamp('created_at');

            $table->foreign('page_id')->references('id')->on('cms_pages')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->unique(['page_id', 'version']);
            $table->index('page_id');
        });

        Schema::create('navigations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 120);
            $table->string('location', 40);
            $table->string('status', 20)->default('draft');
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['name', 'location']);
            $table->index(['location', 'status']);
        });

        Schema::create('navigation_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('navigation_id');
            $table->uuid('parent_id')->nullable();
            $table->string('title', 160);
            $table->string('url', 500)->nullable();
            $table->string('page_slug', 200)->nullable();
            $table->string('icon', 80)->nullable();
            $table->string('visibility', 40)->default('all');
            $table->jsonb('permissions')->nullable();
            $table->jsonb('device_visibility')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->boolean('open_in_new_tab')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('navigation_id')->references('id')->on('navigations')->onDelete('cascade');
            $table->index(['navigation_id', 'parent_id', 'sort_order']);
            $table->index(['navigation_id', 'is_active']);
        });

        // Self-referencing FK added after the table exists so PostgreSQL sees
        // the primary key constraint when validating the reference.
        Schema::table('navigation_items', function (Blueprint $table) {
            $table->foreign('parent_id')->references('id')->on('navigation_items')->onDelete('cascade');
        });

        Schema::create('cms_forms', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 160);
            $table->string('slug')->unique();
            $table->jsonb('fields');
            $table->string('status', 20)->default('draft');
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
        });

        Schema::create('cms_form_submissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('form_id');
            $table->uuid('user_id')->nullable();
            $table->jsonb('data');
            $table->string('status', 20)->default('new');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('form_id')->references('id')->on('cms_forms')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->index(['form_id', 'status']);
        });

        Schema::create('media_library', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title', 255);
            $table->string('file_name', 255);
            $table->string('disk', 64)->default('public');
            $table->string('path', 500);
            $table->string('mime_type', 120);
            $table->unsignedBigInteger('size')->default(0);
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->string('owner_type', 120)->nullable();
            $table->uuid('owner_id')->nullable();
            $table->jsonb('meta')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['owner_type', 'owner_id']);
            $table->index('mime_type');
            $table->unique(['disk', 'path']);
        });

        Schema::create('dynamic_modules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 160);
            $table->string('slug')->unique();
            $table->string('icon', 80)->nullable();
            $table->jsonb('fields');
            $table->jsonb('list_config')->nullable();
            $table->string('status', 20)->default('draft');
            $table->uuid('created_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->index('status');
        });

        Schema::create('dynamic_module_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('module_id');
            $table->string('slug')->nullable();
            $table->jsonb('data');
            $table->string('status', 20)->default('draft');
            $table->uuid('created_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('module_id')->references('id')->on('dynamic_modules')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->index(['module_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dynamic_module_entries');
        Schema::dropIfExists('dynamic_modules');
        Schema::dropIfExists('media_library');
        Schema::dropIfExists('cms_form_submissions');
        Schema::dropIfExists('cms_forms');
        Schema::dropIfExists('navigation_items');
        Schema::dropIfExists('navigations');
        Schema::dropIfExists('cms_revisions');
        Schema::dropIfExists('cms_blocks');
    }
};
