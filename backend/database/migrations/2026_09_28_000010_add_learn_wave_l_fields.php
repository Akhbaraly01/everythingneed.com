<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave L (spec 17/18 LMS): course detail columns (level, objectives,
 * requirements, language), lesson resources + free previews, enrollment
 * recency for continue-learning, and per-lesson learner notes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $blueprint): void {
            $blueprint->string('level', 20)->nullable();
            $blueprint->json('objectives')->nullable();
            $blueprint->text('requirements')->nullable();
            $blueprint->string('language', 10)->nullable();
        });

        Schema::table('course_lessons', function (Blueprint $blueprint): void {
            $blueprint->json('resources')->nullable();
            $blueprint->boolean('is_free_preview')->default(false);
        });

        Schema::table('enrollments', function (Blueprint $blueprint): void {
            $blueprint->timestamp('last_active_at')->nullable();
        });

        Schema::create('lesson_notes', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->index();
            $table->uuid('lesson_id')->index();
            $table->uuid('course_id')->index();
            $table->text('body');
            $table->timestamps();
            $table->unique(['user_id', 'lesson_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_notes');

        Schema::table('enrollments', function (Blueprint $blueprint): void {
            $blueprint->dropColumn('last_active_at');
        });

        Schema::table('course_lessons', function (Blueprint $blueprint): void {
            $blueprint->dropColumn(['resources', 'is_free_preview']);
        });

        Schema::table('courses', function (Blueprint $blueprint): void {
            $blueprint->dropColumn(['level', 'objectives', 'requirements', 'language']);
        });
    }
};
