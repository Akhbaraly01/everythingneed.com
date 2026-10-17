<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Saved jobs (and future saveable types) share the wishlists table:
 * product_id holds any entity id, scoped by entity_type. Drops the
 * products-only FK + unique pair in favour of a typed unique triple.
 * No doctrine/dbal needed (raw statements, PostgreSQL-only project).
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement('ALTER TABLE wishlists DROP CONSTRAINT IF EXISTS wishlists_product_id_foreign');
        DB::statement('ALTER TABLE wishlists DROP CONSTRAINT IF EXISTS wishlists_user_id_product_id_unique');
        DB::statement('ALTER TABLE wishlists ADD CONSTRAINT wishlists_user_entity_unique UNIQUE (user_id, entity_type, product_id)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE wishlists DROP CONSTRAINT IF EXISTS wishlists_user_entity_unique');
        DB::statement('ALTER TABLE wishlists ADD CONSTRAINT wishlists_user_id_product_id_unique UNIQUE (user_id, product_id)');
    }
};
