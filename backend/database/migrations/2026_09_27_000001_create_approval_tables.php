<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approval_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type', 64);
            $table->string('subject_type', 64)->nullable();
            $table->string('subject_id', 64)->nullable();
            $table->string('title');
            $table->json('payload')->nullable();
            $table->string('status', 16)->default('pending');
            $table->unsignedInteger('current_step')->default(1);
            $table->uuid('requested_by')->nullable();
            $table->timestamp('decided_at')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('type');
            $table->foreign('requested_by')->references('id')->on('users')->nullOnDelete();
        });

        Schema::create('approval_steps', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('request_id');
            $table->unsignedInteger('step_order');
            $table->string('approver_role', 40)->nullable();
            $table->string('status', 16)->default('pending');
            $table->uuid('decided_by')->nullable();
            $table->timestamp('decided_at')->nullable();
            $table->string('comment', 500)->nullable();
            $table->timestamps();

            $table->unique(['request_id', 'step_order']);
            $table->foreign('request_id')->references('id')->on('approval_requests')->cascadeOnDelete();
            $table->foreign('decided_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approval_steps');
        Schema::dropIfExists('approval_requests');
    }
};
