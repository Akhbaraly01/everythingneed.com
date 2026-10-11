<?php

use Illuminate\Database\Migrations\Migration;

/**
 * Wave G (spec §32): vendors/admins can mark their fulfilment leg completed
 * once delivered (the customer completes the parent order from the same
 * terminal milestone).
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE vendor_orders DROP CONSTRAINT IF EXISTS vendor_orders_status_check");
        DB::statement("ALTER TABLE vendor_orders ADD CONSTRAINT vendor_orders_status_check
            CHECK (((status)::text = ANY ((ARRAY[
                'pending', 'paid', 'confirmed', 'processing',
                'shipped', 'delivered', 'completed', 'cancelled', 'refunded'
            ]::character varying[])::text[])))");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE vendor_orders DROP CONSTRAINT IF EXISTS vendor_orders_status_check");
        DB::statement("ALTER TABLE vendor_orders ADD CONSTRAINT vendor_orders_status_check
            CHECK (((status)::text = ANY ((ARRAY[
                'pending', 'paid', 'confirmed', 'processing',
                'shipped', 'delivered', 'cancelled', 'refunded'
            ]::character varying[])::text[])))");
    }
};
