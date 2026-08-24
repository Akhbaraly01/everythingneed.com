<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendors', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('store_name');
            $table->string('category');
            $table->text('description')->nullable();
            $table->boolean('is_verified')->default(false);
            $table->decimal('rating', 3, 1)->nullable();
            $table->timestamps();
            $table->index('user_id');
        });

        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('vendor_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('category');
            $table->string('subcategory')->nullable();
            $table->decimal('price', 12, 2);
            $table->decimal('compare_price', 12, 2)->nullable();
            $table->string('image_url')->nullable();
            $table->json('images')->nullable();
            $table->string('video_url')->nullable();
            $table->string('production_video_url')->nullable();
            $table->integer('stock_quantity')->default(0);
            $table->boolean('is_active')->default(true);
            $table->decimal('rating', 3, 1)->nullable();
            $table->integer('reviews_count')->default(0);
            $table->timestamps();
            $table->index('vendor_id');
            $table->index('category');
            $table->index('is_active');
        });

        Schema::create('product_reviews', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('product_id')->constrained()->cascadeOnDelete();
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->integer('rating');
            $table->string('title')->nullable();
            $table->text('comment')->nullable();
            $table->boolean('is_verified_purchase')->default(false);
            $table->integer('helpful_count')->default(0);
            $table->timestamps();
            $table->index('product_id');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_reviews');
        Schema::dropIfExists('products');
        Schema::dropIfExists('vendors');
    }
};
