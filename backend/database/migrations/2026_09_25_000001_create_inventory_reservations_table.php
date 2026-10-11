<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Cart-level stock reservations: a unit in someone's cart is held for
        // them (expires_at) so a second buyer cannot grab it first.
        Schema::create('inventory_reservations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('product_id');
            $table->uuid('user_id');
            $table->unsignedInteger('quantity')->default(1);
            $table->timestamp('expires_at');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['product_id', 'expires_at']);
            $table->index(['user_id', 'expires_at']);
            $table->unique(['user_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_reservations');
    }
};
