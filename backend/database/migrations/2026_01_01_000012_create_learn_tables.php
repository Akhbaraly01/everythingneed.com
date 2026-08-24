<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('courses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description');
            $table->string('category');
            $table->enum('course_type', ['theory', 'practical', 'both'])->default('theory');
            $table->string('instructor_name');
            $table->decimal('price', 10, 2);
            $table->string('thumbnail_url')->nullable();
            $table->string('video_url')->nullable();
            $table->decimal('duration_hours', 5, 1)->nullable();
            $table->integer('students_count')->default(0);
            $table->decimal('rating', 3, 1)->nullable();
            $table->boolean('is_featured')->default(false);
            $table->timestamps();
            $table->index('category');
            $table->index('is_featured');
        });

        Schema::create('course_lessons', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('course_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('content')->nullable();
            $table->string('video_url')->nullable();
            $table->integer('duration_minutes')->nullable();
            $table->integer('lesson_order');
            $table->index('course_id');
        });

        Schema::create('enrollments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('course_id')->constrained()->cascadeOnDelete();
            $table->integer('progress')->default(0);
            $table->timestamp('completed_at')->nullable();
            $table->unique(['user_id', 'course_id']);
        });

        Schema::create('video_progress', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('course_id')->constrained()->cascadeOnDelete();
            $table->uuid('lesson_id')->constrained('course_lessons')->cascadeOnDelete();
            $table->integer('last_position_seconds')->nullable();
            $table->integer('watch_time_seconds')->nullable();
            $table->integer('progress_percent')->nullable();
            $table->boolean('completed')->default(false);
            $table->timestamps();
            $table->index(['user_id', 'course_id']);
        });

        Schema::create('user_certificates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('course_id')->nullable()->constrained()->nullOnDelete();
            $table->string('course_title');
            $table->string('instructor_name');
            $table->string('certificate_number')->unique();
            $table->timestamp('issued_at');
            $table->index('user_id');
        });

        Schema::create('learn_posts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('content');
            $table->string('category');
            $table->string('media_type')->nullable();
            $table->string('media_url')->nullable();
            $table->string('thumbnail_url')->nullable();
            $table->string('video_url')->nullable();
            $table->integer('duration_minutes')->nullable();
            $table->string('author_name')->nullable();
            $table->string('author_avatar')->nullable();
            $table->integer('likes_count')->default(0);
            $table->integer('comments_count')->default(0);
            $table->integer('shares_count')->default(0);
            $table->boolean('is_featured')->default(false);
            $table->string('status')->default('published');
            $table->timestamps();
            $table->index('user_id');
            $table->index('category');
        });

        Schema::create('learn_post_comments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('post_id')->constrained('learn_posts')->cascadeOnDelete();
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->text('content');
            $table->timestamps();
            $table->index('post_id');
        });

        Schema::create('learn_post_likes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('post_id')->constrained('learn_posts')->cascadeOnDelete();
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->unique(['post_id', 'user_id']);
        });

        Schema::create('learn_direct_messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('sender_id')->constrained('users')->cascadeOnDelete();
            $table->uuid('receiver_id')->constrained('users')->cascadeOnDelete();
            $table->text('message');
            $table->uuid('post_id')->nullable()->constrained('learn_posts')->nullOnDelete();
            $table->boolean('is_read')->default(false);
            $table->timestamp('created_at');
            $table->index('sender_id');
            $table->index('receiver_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('learn_direct_messages');
        Schema::dropIfExists('learn_post_likes');
        Schema::dropIfExists('learn_post_comments');
        Schema::dropIfExists('learn_posts');
        Schema::dropIfExists('user_certificates');
        Schema::dropIfExists('video_progress');
        Schema::dropIfExists('enrollments');
        Schema::dropIfExists('course_lessons');
        Schema::dropIfExists('courses');
    }
};
