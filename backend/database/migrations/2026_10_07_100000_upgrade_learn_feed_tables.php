<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Learn 2.0 knowledge feed (phase L-A).
 *
 * Additive only - the legacy learn_posts columns and the pending/approved/
 * rejected workflow they encode keep working unchanged; this migration layers
 * the richer moderation state machine, video provenance, curation and the
 * social-learning tables (reports, saves, watch heartbeats, follows,
 * playlists, comment replies/likes) on top.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('learn_posts', function (Blueprint $table) {
            // Video provenance: upload = self-hosted via MediaService,
            // anything else = provider + id resolved at submit time so the
            // player never trusts an arbitrary embed URL at render time.
            $table->string('video_provider', 20)->nullable();
            $table->string('provider_video_id', 190)->nullable();
            $table->unsignedInteger('duration_seconds')->nullable();
            $table->unsignedInteger('views_count')->default(0);
            $table->string('slug', 190)->nullable()->unique();
            $table->string('language', 10)->nullable();
            $table->string('license', 40)->nullable();
            $table->boolean('sensitive_topic')->default(false);

            // Moderation workflow.
            $table->text('rejection_reason')->nullable();
            $table->text('appeal_reason')->nullable();
            $table->uuid('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->uuid('assigned_to')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->boolean('is_pinned')->default(false);

            $table->index(['status', 'created_at']);
            $table->index('assigned_to');
            $table->index('video_provider');
        });

        Schema::table('learn_post_comments', function (Blueprint $table) {
            $table->uuid('parent_id')->nullable()->constrained('learn_post_comments')->nullOnDelete();
            $table->unsignedInteger('likes_count')->default(0);
            $table->string('status', 20)->default('visible');

            $table->index('parent_id');
            $table->index(['post_id', 'parent_id']);
        });

        Schema::create('learn_post_reports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('post_id')->constrained('learn_posts')->cascadeOnDelete();
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('reason', 40);
            $table->string('details', 500)->nullable();
            $table->string('status', 20)->default('open');
            $table->uuid('handled_by')->nullable();
            $table->timestamp('handled_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['post_id', 'user_id']);
            $table->index('status');
        });

        Schema::create('learn_post_saves', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('post_id')->constrained('learn_posts')->cascadeOnDelete();
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['post_id', 'user_id']);
            $table->index(['user_id', 'created_at']);
        });

        Schema::create('learn_video_views', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('post_id')->constrained('learn_posts')->cascadeOnDelete();
            $table->uuid('user_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedInteger('watch_seconds')->default(0);
            $table->boolean('completed')->default(false);
            $table->timestamps();
            $table->softDeletes();
            $table->index('post_id');
            $table->index(['user_id', 'post_id']);
        });

        Schema::create('learn_follows', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('follower_id')->constrained('users')->cascadeOnDelete();
            $table->uuid('creator_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['follower_id', 'creator_id']);
            $table->index('creator_id');
        });

        Schema::create('learn_playlists', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('name', 120);
            $table->string('kind', 30)->default('custom');
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['user_id', 'name']);
        });

        Schema::create('learn_playlist_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('playlist_id')->constrained('learn_playlists')->cascadeOnDelete();
            $table->uuid('post_id')->constrained('learn_posts')->cascadeOnDelete();
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['playlist_id', 'post_id']);
        });

        Schema::create('learn_comment_likes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('comment_id')->constrained('learn_post_comments')->cascadeOnDelete();
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['comment_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('learn_comment_likes');
        Schema::dropIfExists('learn_playlist_items');
        Schema::dropIfExists('learn_playlists');
        Schema::dropIfExists('learn_follows');
        Schema::dropIfExists('learn_video_views');
        Schema::dropIfExists('learn_post_saves');
        Schema::dropIfExists('learn_post_reports');

        Schema::table('learn_post_comments', function (Blueprint $table) {
            $table->dropIndex(['post_id', 'parent_id']);
            $table->dropIndex(['post_id']);
            $table->dropColumn(['parent_id', 'likes_count', 'status']);
        });

        Schema::table('learn_posts', function (Blueprint $table) {
            $table->dropIndex(['status', 'created_at']);
            $table->dropUnique(['slug']);
            $table->dropColumn([
                'video_provider', 'provider_video_id', 'duration_seconds',
                'views_count', 'slug', 'language', 'license', 'sensitive_topic',
                'rejection_reason', 'appeal_reason', 'reviewed_by', 'reviewed_at',
                'assigned_to', 'submitted_at', 'published_at', 'is_pinned',
            ]);
        });
    }
};
