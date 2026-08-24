<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Multi-vendor orders share one parent order_number across legs,
        // so the legacy UNIQUE constraint must become a plain index.
        DB::statement('ALTER TABLE vendor_orders DROP CONSTRAINT IF EXISTS vendor_orders_order_number_unique');
        $indexExists = DB::select("SELECT 1 FROM pg_indexes WHERE indexname = 'vendor_orders_order_number_index'");
        if (!$indexExists) {
            Schema::table('vendor_orders', function ($table) {
                $table->index('order_number');
            });
        }

        // Extend the lifecycle with paid/refunded states.
        DB::statement("ALTER TABLE vendor_orders DROP CONSTRAINT IF EXISTS vendor_orders_status_check");
        DB::statement("ALTER TABLE vendor_orders ADD CONSTRAINT vendor_orders_status_check
            CHECK (((status)::text = ANY ((ARRAY[
                'pending', 'paid', 'confirmed', 'processing',
                'shipped', 'delivered', 'cancelled', 'refunded'
            ]::character varying[])::text[])))");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE vendor_orders DROP CONSTRAINT IF EXISTS vendor_orders_status_check");
        DB::statement("ALTER TABLE vendor_orders ADD CONSTRAINT vendor_orders_status_check
            CHECK (((status)::text = ANY ((ARRAY[
                'pending', 'confirmed', 'processing',
                'shipped', 'delivered', 'cancelled'
            ]::character varying[])::text[])))");

        DB::statement('DROP INDEX IF EXISTS vendor_orders_order_number_index');
        DB::statement('ALTER TABLE vendor_orders ADD CONSTRAINT vendor_orders_order_number_unique UNIQUE (order_number)');
    }
};
