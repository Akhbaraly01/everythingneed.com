<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_variants', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('product_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('sku')->nullable();
            $table->decimal('price', 12, 2);
            $table->integer('stock_quantity')->default(0);
            $table->json('attributes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            $table->index('product_id');
            $table->index('sku');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->uuid('variant_id')->nullable()->after('product_id');
            $table->string('variant_name')->nullable()->after('product_name');
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn(['variant_id', 'variant_name']);
        });
        Schema::dropIfExists('product_variants');
    }
};
