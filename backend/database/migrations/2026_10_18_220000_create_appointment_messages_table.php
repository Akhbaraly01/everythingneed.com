<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // L-H-3: appointment discussion thread. After a booking is paid the
        // patient (and the assigned doctor/admin) can post messages on the
        // ticket — questions, schedule changes, or issue reports.
        Schema::create('appointment_messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('ticket_id');
            $table->uuid('user_id');
            $table->text('body');
            $table->timestamps();
            $table->softDeletes();

            $table->index('ticket_id');
            $table->foreign('ticket_id')->references('id')->on('health_tickets')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointment_messages');
    }
};
