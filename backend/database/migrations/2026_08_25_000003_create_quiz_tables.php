<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('quizzes')) {
            Schema::create('quizzes', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('course_id')->nullable()->index();
                $table->string('title', 180);
                // [{id, question, options[], correct_index, explanation?}]
                $table->json('questions');
                $table->unsignedTinyInteger('pass_score_percent')->default(70);
                $table->timestamps();
                $table->softDeletes();
            });
        }

        if (!Schema::hasTable('quiz_attempts')) {
            Schema::create('quiz_attempts', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('quiz_id')->index();
                $table->uuid('user_id')->index();
                $table->json('answers');      // {questionId: chosenIndex}
                $table->json('result');       // {score, total, passed}
                $table->boolean('passed');
                $table->timestamps();
                $table->softDeletes();

                $table->index(['quiz_id', 'user_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_attempts');
        Schema::dropIfExists('quizzes');
    }
};
