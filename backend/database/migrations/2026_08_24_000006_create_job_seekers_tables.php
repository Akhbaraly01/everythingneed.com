<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('worker_profiles')) {
            Schema::create('worker_profiles', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('user_id');
                $table->string('headline', 160);
                $table->text('bio')->nullable();
                $table->string('category', 80)->index();
                $table->json('skills')->nullable();        // [{name, level}]
                $table->json('experience')->nullable();    // [{title, company, from, to, description}]
                $table->json('education')->nullable();     // [{institution, degree, year}]
                $table->json('portfolio')->nullable();     // [{title, url, description}]
                $table->decimal('hourly_rate', 10, 2)->nullable();
                $table->decimal('daily_rate', 10, 2)->nullable();
                $table->string('currency', 3)->default('USD');
                $table->string('availability', 20)->default('available'); // available|busy|unavailable
                $table->string('city', 120)->nullable()->index();
                $table->string('country', 120)->nullable();
                $table->decimal('rating_avg', 3, 2)->default(0);
                $table->unsignedInteger('rating_count')->default(0);
                $table->unsignedInteger('completed_jobs')->default(0);
                $table->boolean('is_verified')->default(false);
                $table->timestamps();
                $table->softDeletes();

                $table->unique('user_id');
                $table->index(['category', 'availability']);
            });
        }

        if (!Schema::hasTable('work_requests')) {
            Schema::create('work_requests', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('requester_id');
                $table->uuid('worker_profile_id')->nullable();
                $table->string('title', 180);
                $table->text('description')->nullable();
                $table->string('category', 80)->index();
                $table->string('location', 200)->nullable();
                $table->date('start_date')->nullable();
                $table->string('estimated_duration', 80)->nullable();
                $table->decimal('budget_min', 10, 2)->nullable();
                $table->decimal('budget_max', 10, 2)->nullable();
                $table->string('currency', 3)->default('USD');
                $table->unsignedInteger('workers_needed')->default(1);
                $table->string('status', 30)->default('open'); // open|negotiating|accepted|paid|in_progress|completed|cancelled|disputed
                $table->decimal('agreed_rate', 10, 2)->nullable();
                $table->timestamp('rated_at')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['requester_id', 'status']);
                $table->index('worker_profile_id');
            });
        }

        if (!Schema::hasTable('work_offers')) {
            Schema::create('work_offers', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('work_request_id');
                $table->uuid('worker_profile_id')->nullable();
                $table->string('proposed_by', 12); // requester|worker
                $table->decimal('rate', 10, 2);
                $table->text('message')->nullable();
                $table->string('status', 20)->default('pending'); // pending|accepted|rejected|countered
                $table->timestamps();
                $table->softDeletes();

                $table->index('work_request_id');
                $table->index('worker_profile_id');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('work_offers');
        Schema::dropIfExists('work_requests');
        Schema::dropIfExists('worker_profiles');
    }
};
