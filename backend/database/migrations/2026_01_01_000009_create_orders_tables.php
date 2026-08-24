<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendor_orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('vendor_id')->constrained()->cascadeOnDelete();
            $table->uuid('customer_id')->constrained('users')->cascadeOnDelete();
            $table->uuid('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('product_name');
            $table->integer('quantity');
            $table->decimal('unit_price', 12, 2);
            $table->decimal('total_price', 12, 2);
            $table->string('order_number')->unique();
            $table->text('shipping_address')->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])->default('pending');
            $table->timestamps();
            $table->index('vendor_id');
            $table->index('customer_id');
            $table->index('status');
        });

        Schema::create('medicine_orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('order_number')->unique();
            $table->text('delivery_address');
            $table->string('prescription_url')->nullable();
            $table->decimal('total_amount', 12, 2);
            $table->enum('status', ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])->default('pending');
            $table->timestamps();
            $table->index('user_id');
            $table->index('status');
        });

        Schema::create('medicine_order_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('order_id')->constrained('medicine_orders')->cascadeOnDelete();
            $table->uuid('medicine_id')->constrained()->cascadeOnDelete();
            $table->integer('quantity');
            $table->decimal('unit_price', 10, 2);
            $table->index('order_id');
        });

        Schema::create('order_tracking', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('order_id');
            $table->string('order_type');
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('vendor_id')->nullable();
            $table->string('status');
            $table->string('status_message')->nullable();
            $table->timestamp('estimated_delivery')->nullable();
            $table->decimal('location_lat', 10, 7)->nullable();
            $table->decimal('location_lng', 10, 7)->nullable();
            $table->timestamps();
            $table->index('order_id');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_tracking');
        Schema::dropIfExists('medicine_order_items');
        Schema::dropIfExists('medicine_orders');
        Schema::dropIfExists('vendor_orders');
    }
};
