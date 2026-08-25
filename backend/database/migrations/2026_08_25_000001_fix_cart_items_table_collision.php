<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Resolves the cart table collision: the checkout module's CartItem model
 * conventionally maps to "cart_items", which historically held a PHARMACY
 * shape (user_id, medicine_id) while the real cart shape lived unused in
 * "cart_items_v2". Both tables were empty in every environment, so we
 * retire the stale shape and move the correct one into place.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('cart_items_v2')) {
            return; // already migrated (or never existed)
        }

        // Safety valve: refuse to destroy unexpected data.
        $legacyCount = DB::table('cart_items')->count();
        if ($legacyCount > 0) {
            throw new RuntimeException(
                "cart_items holds {$legacyCount} legacy pharmacy rows — archive them before migrating."
            );
        }

        Schema::drop('cart_items');
        Schema::rename('cart_items_v2', 'cart_items');
    }

    public function down(): void
    {
        if (Schema::hasTable('cart_items') && !Schema::hasTable('cart_items_v2')) {
            Schema::rename('cart_items', 'cart_items_v2');
        }
    }
};
