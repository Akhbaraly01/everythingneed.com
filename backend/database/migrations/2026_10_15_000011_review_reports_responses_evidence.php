<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * TODO 17 trust: review reports (one per reporter, moderated), a single
 * provider response per review, and dispute evidence rows. Nothing here
 * rewrites history — reports queue, responses append, evidence accumulates.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('review_reports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('review_id')->index();
            $table->uuid('reporter_id')->index();
            $table->string('reason', 500);
            $table->string('status', 20)->default('open')->index();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['review_id', 'reporter_id'], 'review_reports_review_reporter_unique');
            $table->foreign('review_id')->references('id')->on('reviews')->cascadeOnDelete();
        });

        Schema::table('reviews', function (Blueprint $table) {
            $table->text('provider_response')->nullable();
            $table->timestamp('responded_at')->nullable();
        });

        Schema::create('dispute_evidence', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('dispute_id')->index();
            $table->uuid('uploaded_by')->index();
            $table->string('file_url', 500);
            $table->string('note', 1000)->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->foreign('dispute_id')->references('id')->on('disputes')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dispute_evidence');

        Schema::table('reviews', function (Blueprint $table) {
            $table->dropColumn(['provider_response', 'responded_at']);
        });

        Schema::dropIfExists('review_reports');
    }
};
