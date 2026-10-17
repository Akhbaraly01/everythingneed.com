<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * N-40 hotel reviews: one review per guest per hotel. The controller
 * checks first; this partial unique index collapses concurrent
 * double-submits atomically (same pattern as need reviews).
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement(
            "CREATE UNIQUE INDEX IF NOT EXISTS reviews_user_hotel_unique
             ON reviews (user_id, reviewable_id) WHERE reviewable_type = 'hotel' AND deleted_at IS NULL"
        );
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS reviews_user_hotel_unique');
    }
};
