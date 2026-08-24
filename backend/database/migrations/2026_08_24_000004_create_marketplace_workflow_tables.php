<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('need_requests')) {
            Schema::create('need_requests', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('user_id')->index();
                $table->uuid('category_id')->nullable()->index();
                $table->string('request_number', 30)->unique();
                $table->string('title');
                $table->text('description');
                $table->decimal('budget_min', 12, 2)->nullable();
                $table->decimal('budget_max', 12, 2)->nullable();
                $table->string('location')->nullable();
                $table->date('deadline')->nullable();
                $table->json('attachments')->nullable();
                $table->enum('status', [
                    'pending', 'reviewing', 'offered', 'accepted',
                    'paid', 'in_progress', 'completed', 'cancelled',
                ])->default('pending')->index();
                $table->timestamps();
                $table->softDeletes();

                $table->foreign('user_id')
                    ->references('id')->on('users')
                    ->cascadeOnDelete();

                $table->index(['user_id', 'status']);
            });
        }

        if (!Schema::hasTable('need_offers')) {
            Schema::create('need_offers', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('need_request_id')->index();
                $table->uuid('provider_id')->index();
                $table->decimal('price', 12, 2);
                $table->text('message')->nullable();
                $table->enum('status', ['pending', 'accepted', 'rejected', 'withdrawn'])
                    ->default('pending');
                $table->timestamps();
                $table->softDeletes();

                $table->foreign('need_request_id')
                    ->references('id')->on('need_requests')
                    ->cascadeOnDelete();

                $table->unique(['need_request_id', 'provider_id']);
            });
        }

        if (!Schema::hasTable('task_posts')) {
            Schema::create('task_posts', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('created_by')->index();
                $table->string('post_number', 30)->unique();
                $table->string('title');
                $table->text('description');
                $table->unsignedInteger('quantity')->default(1);
                $table->decimal('budget', 12, 2);
                $table->date('deadline')->nullable();
                $table->json('requirements')->nullable();
                $table->enum('status', [
                    'open', 'in_review', 'assigned', 'completed', 'cancelled',
                ])->default('open')->index();
                $table->uuid('assigned_application_id')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->foreign('created_by')
                    ->references('id')->on('users')
                    ->cascadeOnDelete();

                $table->index(['status', 'created_at']);
            });
        }

        if (!Schema::hasTable('task_applications')) {
            Schema::create('task_applications', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('task_post_id')->index();
                $table->uuid('user_id')->index();
                $table->text('message')->nullable();
                $table->string('evidence_url')->nullable();
                $table->text('evidence_note')->nullable();
                $table->decimal('payout', 12, 2)->nullable();
                $table->enum('status', [
                    'pending', 'approved', 'rejected',
                    'submitted', 'verified', 'paid',
                ])->default('pending')->index();
                $table->timestamps();
                $table->softDeletes();

                $table->foreign('task_post_id')
                    ->references('id')->on('task_posts')
                    ->cascadeOnDelete();

                $table->unique(['task_post_id', 'user_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('task_applications');
        Schema::dropIfExists('task_posts');
        Schema::dropIfExists('need_offers');
        Schema::dropIfExists('need_requests');
    }
};
