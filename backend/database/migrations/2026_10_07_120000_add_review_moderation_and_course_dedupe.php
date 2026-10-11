<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * L-B.5 review hardening (course reviews):
 *  - reviews.status + moderation columns. Existing rows backfill to
 *    `approved`, so every already-shipping surface keeps showing them.
 *  - one live review per learner per course (partial unique index, the same
 *    Postgres pattern the need-request dedupe already uses).
 *  - courses.reviews_count so the catalog can show an honest count next to
 *    the aggregate that CourseRatingAggregator maintains.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->string('status', 20)->default('approved')->after('rating');
            $table->uuid('moderated_by')->nullable();
            $table->timestamp('moderated_at')->nullable();
            $table->string('moderation_reason', 500)->nullable();
        });

        DB::table('reviews')->whereNull('status')->update(['status' => 'approved']);

        Schema::table('reviews', function (Blueprint $table) {
            $table->index('status');
        });

        DB::statement(
            "CREATE UNIQUE INDEX IF NOT EXISTS reviews_user_course_unique
             ON reviews (user_id, reviewable_id)
             WHERE reviewable_type = 'course' AND deleted_at IS NULL"
        );

        Schema::table('courses', function (Blueprint $table) {
            $table->unsignedInteger('reviews_count')->default(0)->after('rating');
        });
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS reviews_user_course_unique');

        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn('reviews_count');
        });

        Schema::table('reviews', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropColumn(['status', 'moderated_by', 'moderated_at', 'moderation_reason']);
        });
    }
};
