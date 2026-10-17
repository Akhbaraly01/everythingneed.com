<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * TODO 09 service listings: moderation states, packages/add-ons, terms, and
 * ownership. Backfill honors current visibility: available rows were public,
 * so they become published; unavailable rows become archived. Nothing new
 * ever reaches the public without passing review.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('need_items', function (Blueprint $table) {
            $table->string('status', 20)->default('draft')->index();
            $table->uuid('user_id')->nullable()->index();
            $table->json('packages')->nullable();
            $table->text('deliverables')->nullable();
            $table->text('exclusions')->nullable();
            $table->json('add_ons')->nullable();
            $table->string('estimated_duration', 120)->nullable();
            $table->text('requirements')->nullable();
            $table->text('cancellation_terms')->nullable();
            $table->string('revision_policy', 255)->nullable();
            $table->text('review_note')->nullable();
            $table->timestamp('published_at')->nullable();
        });

        DB::table('need_items')->where('is_available', true)->update([
            'status' => 'published',
            'published_at' => now(),
        ]);
        DB::table('need_items')->where('is_available', false)->update([
            'status' => 'archived',
        ]);
    }

    public function down(): void
    {
        Schema::table('need_items', function (Blueprint $table) {
            $table->dropColumn([
                'status', 'user_id', 'packages', 'deliverables', 'exclusions',
                'add_ons', 'estimated_duration', 'requirements',
                'cancellation_terms', 'revision_policy', 'review_note',
                'published_at',
            ]);
        });
    }
};
