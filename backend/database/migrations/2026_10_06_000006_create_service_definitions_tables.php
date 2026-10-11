<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Spec 39: admin-defined service catalogue (no code per service).
        Schema::create('service_definitions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 120);
            $table->string('category', 50)->index();
            $table->text('description')->nullable();
            $table->string('image_url', 500)->nullable();
            $table->string('provider', 120)->nullable();
            $table->string('pricing_mode', 20)->default('fixed');
            $table->decimal('base_price', 12, 2)->default(0);
            $table->string('currency', 3)->default('USD');
            $table->string('location', 100)->nullable();
            $table->json('availability')->nullable();
            $table->boolean('requires_booking')->default(true);
            $table->json('booking_fields')->nullable();
            $table->json('documents')->nullable();
            $table->boolean('requires_payment')->default(false);
            $table->text('cancellation_rules')->nullable();
            $table->text('delivery_rules')->nullable();
            $table->string('status', 20)->default('active')->index();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('service_bookings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('booking_number')->unique();
            $table->uuid('service_id');
            $table->uuid('user_id');
            $table->string('notes', 1000)->nullable();
            $table->json('answers')->nullable();
            $table->decimal('amount', 12, 2)->default(0);
            $table->string('currency', 3)->default('USD');
            $table->string('status', 20)->default('pending');
            $table->string('payment_status', 20)->default('unpaid');
            $table->uuid('payment_id')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('user_id');
            $table->index('service_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_bookings');
        Schema::dropIfExists('service_definitions');
    }
};
