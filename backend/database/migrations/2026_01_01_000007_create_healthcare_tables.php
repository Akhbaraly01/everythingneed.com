<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('departments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('doctors', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('full_name');
            $table->string('specialization');
            $table->string('qualification');
            $table->integer('experience_years')->default(0);
            $table->decimal('consultation_fee', 10, 2);
            $table->decimal('virtual_fee', 10, 2)->nullable();
            $table->string('avatar_url')->nullable();
            $table->boolean('is_available')->default(true);
            $table->decimal('rating', 3, 1)->nullable();
            $table->timestamps();
            $table->index('specialization');
            $table->index('is_available');
        });

        Schema::create('health_tickets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('patient_id')->constrained('users')->cascadeOnDelete();
            $table->uuid('doctor_id')->nullable()->constrained('doctors')->nullOnDelete();
            $table->string('ticket_number')->unique();
            $table->text('symptoms');
            $table->text('description')->nullable();
            $table->string('consultation_type')->nullable();
            $table->decimal('consultation_fee', 10, 2)->nullable();
            $table->date('appointment_date')->nullable();
            $table->time('appointment_time')->nullable();
            $table->boolean('is_random_assignment')->default(false);
            $table->enum('status', ['pending', 'assigned', 'in_consultation', 'completed', 'cancelled'])->default('pending');
            $table->timestamps();
            $table->index('patient_id');
            $table->index('doctor_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('health_tickets');
        Schema::dropIfExists('doctors');
        Schema::dropIfExists('departments');
    }
};
