<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medicines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('generic_name')->nullable();
            $table->string('category');
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2);
            $table->string('image_url')->nullable();
            $table->boolean('requires_prescription')->default(false);
            $table->integer('stock_quantity')->default(0);
            $table->timestamps();
            $table->index('category');
        });

        Schema::create('cart_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('medicine_id')->constrained()->cascadeOnDelete();
            $table->integer('quantity')->default(1);
            $table->timestamp('created_at')->nullable();
            $table->unique(['user_id', 'medicine_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cart_items');
        Schema::dropIfExists('medicines');
    }
};
