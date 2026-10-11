<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave C - page-builder metadata on the legacy cms_pages table (spec S41):
 * description, SEO fields, canonical URL, visibility, template, menu
 * placement and publish timestamp. All additive with defaults/NULLs so the
 * existing seeded rows keep working unchanged.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cms_pages', function (Blueprint $table) {
            $table->text('description')->nullable()->after('content');
            $table->string('seo_title', 255)->nullable()->after('description');
            $table->string('seo_description', 320)->nullable()->after('seo_title');
            $table->string('seo_image', 500)->nullable()->after('seo_description');
            $table->string('canonical_url', 500)->nullable()->after('seo_image');
            $table->string('visibility', 20)->default('public')->after('canonical_url');
            $table->string('template', 40)->default('default')->after('visibility');
            $table->string('menu_placement', 40)->nullable()->after('template');
            $table->timestamp('published_at')->nullable()->after('menu_placement');
        });
    }

    public function down(): void
    {
        Schema::table('cms_pages', function (Blueprint $table) {
            $table->dropColumn([
                'description', 'seo_title', 'seo_description', 'seo_image',
                'canonical_url', 'visibility', 'template', 'menu_placement', 'published_at',
            ]);
        });
    }
};
