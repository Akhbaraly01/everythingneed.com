<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Plan G2: order <-> rider assignment ledger.
 *
 * One delivery row per order (unique order_id). A delivery is created
 * unassigned by checkout/admin tooling and claimed by / assigned to a
 * delivery manager; the rider advances it through a strict status chain.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('deliveries')) {
            return;
        }

        Schema::create('deliveries', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('order_id')->unique();
            $table->uuid('manager_id')->nullable()->index();
            $table->string('status', 30)->default('assigned')->index();
            $table->text('pickup_address')->nullable();
            $table->text('delivery_address')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('assigned_at')->nullable();
            $table->timestamp('picked_up_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('order_id')->references('id')->on('orders')->cascadeOnDelete();
            $table->foreign('manager_id')->references('id')->on('delivery_managers')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deliveries');
    }
};
