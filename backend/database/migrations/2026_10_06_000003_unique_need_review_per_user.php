<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Plan loop (§29 concurrency): one review per user per need request.
 * The controller checks first, but concurrent double-submits need the
 * partial unique index to collapse atomically.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement(
            "CREATE UNIQUE INDEX IF NOT EXISTS reviews_user_need_unique
             ON reviews (user_id, reviewable_id) WHERE reviewable_type = 'need_request' AND deleted_at IS NULL"
        );
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS reviews_user_need_unique');
    }
};
