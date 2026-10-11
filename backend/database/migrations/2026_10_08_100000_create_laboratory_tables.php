<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lab_tests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('category')->nullable();
            $table->decimal('price', 10, 2);
            $table->text('preparation_instructions')->nullable();
            $table->integer('result_time_hours')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            $table->index('category');
            $table->index('is_active');
        });

        Schema::create('lab_bookings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('patient_id')->constrained('users')->cascadeOnDelete();
            $table->uuid('lab_test_id')->constrained('lab_tests')->cascadeOnDelete();
            $table->string('booking_number')->unique();
            $table->date('appointment_date');
            $table->time('appointment_time');
            $table->decimal('price', 10, 2);
            $table->string('status')->default('pending'); // pending|confirmed|completed|cancelled
            $table->boolean('is_paid')->default(false);
            $table->string('payment_reference')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index('patient_id');
            $table->index('lab_test_id');
            $table->index('status');
        });

        // Spec 24 backstop: one live booking per (test, slot); cancelled
        // bookings free the slot again. Must run after the table exists.
        DB::statement(
            'CREATE UNIQUE INDEX lab_bookings_slot_unique
             ON lab_bookings (lab_test_id, appointment_date, appointment_time)
             WHERE status != \'cancelled\''
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('lab_bookings');
        Schema::dropIfExists('lab_tests');
    }
};
