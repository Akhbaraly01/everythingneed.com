<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('health_service_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('patient_id')->constrained('users')->cascadeOnDelete();
            $table->string('request_number')->unique();
            $table->string('category');
            $table->string('title');
            $table->text('details');
            $table->date('preferred_date')->nullable();
            $table->string('location')->nullable();
            $table->string('contact_phone', 40)->nullable();
            // open|contacted|scheduled|closed|cancelled
            $table->string('status')->default('open');
            $table->uuid('assigned_doctor_id')->nullable();
            $table->text('admin_note')->nullable();
            $table->uuid('decided_by')->nullable();
            $table->timestamp('decided_at')->nullable();
            $table->string('idempotency_key')->nullable()->unique();
            $table->timestamps();
            $table->softDeletes();
            $table->index('patient_id');
            $table->index('status');
            $table->index('category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('health_service_requests');
    }
};
