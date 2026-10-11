<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('health_tickets', function (Blueprint $table) {
            $table->string('payment_status', 20)->default('unpaid');
            $table->uuid('payment_id')->nullable();
            $table->timestamp('paid_at')->nullable();
        });

        Schema::table('hotel_reservations', function (Blueprint $table) {
            $table->string('payment_status', 20)->default('unpaid');
            $table->uuid('payment_id')->nullable();
            $table->timestamp('paid_at')->nullable();
        });

        Schema::create('expert_bookings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('booking_number')->unique();
            $table->uuid('expert_id');
            $table->uuid('user_id');
            $table->date('scheduled_date');
            $table->string('scheduled_time', 8);
            $table->unsignedInteger('duration_minutes')->default(60);
            $table->string('mode', 20)->default('virtual');
            $table->string('notes', 1000)->nullable();
            $table->decimal('amount', 10, 2)->default(0);
            $table->string('currency', 3)->default('USD');
            $table->string('status', 20)->default('pending');
            $table->string('payment_status', 20)->default('unpaid');
            $table->uuid('payment_id')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('user_id');
            $table->index('expert_id');
        });

        // Two active bookings can never share the same expert slot.
        DB::statement(
            "CREATE UNIQUE INDEX expert_bookings_slot_unique
             ON expert_bookings (expert_id, scheduled_date, scheduled_time)
             WHERE status NOT IN ('cancelled', 'completed')"
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('expert_bookings');

        Schema::table('hotel_reservations', function (Blueprint $table) {
            $table->dropColumn(['payment_status', 'payment_id', 'paid_at']);
        });

        Schema::table('health_tickets', function (Blueprint $table) {
            $table->dropColumn(['payment_status', 'payment_id', 'paid_at']);
        });
    }
};
