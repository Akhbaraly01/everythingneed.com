<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('order_id')->nullable();
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('USD');
            $table->enum('status', ['pending', 'processing', 'succeeded', 'failed', 'refunded', 'partially_refunded'])->default('pending');
            $table->string('method');
            $table->string('reference')->unique();
            $table->json('gateway_response')->nullable();
            $table->timestamps();
            $table->index('user_id');
            $table->index('status');
            $table->index('reference');
        });

        Schema::create('refunds', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('payment_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 12, 2);
            $table->text('reason')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected', 'completed'])->default('pending');
            $table->timestamps();
            $table->index('payment_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('refunds');
        Schema::dropIfExists('payments');
    }
};
