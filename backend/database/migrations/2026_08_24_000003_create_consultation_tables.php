<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('consultations')) {
            Schema::create('consultations', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('ticket_id')->unique();
                $table->text('diagnosis')->nullable();
                $table->text('notes')->nullable();
                $table->json('prescription_items')->nullable(); // [{medicine, dosage, duration}]
                $table->date('follow_up_date')->nullable();
                $table->uuid('created_by')->nullable()->index();
                $table->timestamps();
                $table->softDeletes();

                $table->foreign('ticket_id')
                    ->references('id')->on('health_tickets')
                    ->cascadeOnDelete();
            });
        }

        if (!Schema::hasTable('prescriptions')) {
            Schema::create('prescriptions', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('code', 30)->unique();
                $table->uuid('patient_id')->index();
                $table->uuid('doctor_id')->nullable()->index();
                $table->uuid('consultation_id')->nullable()->index();
                $table->json('items'); // [{name, dosage, frequency, duration, notes}]
                $table->enum('status', ['active', 'filled', 'expired'])->default('active');
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->foreign('patient_id')
                    ->references('id')->on('users')
                    ->cascadeOnDelete();

                $table->index(['patient_id', 'status']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('prescriptions');
        Schema::dropIfExists('consultations');
    }
};
