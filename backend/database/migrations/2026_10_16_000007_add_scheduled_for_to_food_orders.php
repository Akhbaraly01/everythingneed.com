<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * N-42 food scheduled orders: customers may pick a future delivery time.
 * Nullable — immediate orders (the default) are unchanged. The existing
 * estimated_delivery_time column stays operator-facing (ETA), this one
 * is the customer's chosen slot.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('food_orders', function (Blueprint $table) {
            $table->timestamp('scheduled_for')->nullable()->after('estimated_delivery_time');
        });
    }

    public function down(): void
    {
        Schema::table('food_orders', function (Blueprint $table) {
            $table->dropColumn('scheduled_for');
        });
    }
};
