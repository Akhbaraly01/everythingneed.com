<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('orders')) {
            Schema::create('orders', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('user_id')->index();
                $table->string('order_number', 40)->unique();
                $table->enum('status', [
                    'pending', 'paid', 'processing', 'shipped',
                    'delivered', 'cancelled', 'refunded',
                ])->default('pending')->index();
                $table->decimal('subtotal', 12, 2)->default(0);
                $table->decimal('discount', 12, 2)->default(0);
                $table->decimal('shipping_fee', 12, 2)->default(0);
                $table->decimal('total_amount', 12, 2)->default(0);
                $table->string('currency', 3)->default('USD');
                $table->string('coupon_code', 50)->nullable();
                $table->text('shipping_address');
                $table->string('shipping_city')->nullable();
                $table->string('shipping_country', 100)->nullable();
                $table->string('phone', 30)->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->foreign('user_id')
                    ->references('id')->on('users')
                    ->cascadeOnDelete();

                $table->index(['user_id', 'status']);
            });
        }

        if (!Schema::hasTable('order_items')) {
            Schema::create('order_items', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('order_id')->index();
                $table->uuid('product_id')->index();
                $table->uuid('vendor_id')->nullable()->index();
                $table->string('product_name');
                $table->unsignedInteger('quantity');
                $table->decimal('unit_price', 12, 2);
                $table->decimal('total_price', 12, 2);
                $table->timestamps();
                $table->softDeletes();

                $table->foreign('order_id')
                    ->references('id')->on('orders')
                    ->cascadeOnDelete();

                $table->foreign('product_id')
                    ->references('id')->on('products')
                    ->nullOnDelete();
            });
        }

        if (!Schema::hasColumn('vendor_orders', 'order_id')) {
            Schema::table('vendor_orders', function (Blueprint $table) {
                $table->uuid('order_id')->nullable()->after('id')->index();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('vendor_orders', 'order_id')) {
            Schema::table('vendor_orders', function (Blueprint $table) {
                $table->dropColumn('order_id');
            });
        }

        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
    }
};
