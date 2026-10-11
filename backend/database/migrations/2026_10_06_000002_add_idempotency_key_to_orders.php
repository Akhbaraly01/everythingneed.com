<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Plan loop (phase 11): duplicate-checkout protection for product orders.
 * A client-supplied idempotency key replays to the original order instead
 * of creating a second one. The partial unique index makes concurrent
 * double-submits collapse atomically.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            if (!Schema::hasColumn('orders', 'idempotency_key')) {
                $table->string('idempotency_key', 100)->nullable()->after('order_number');
            }
        });

        DB::statement(
            'CREATE UNIQUE INDEX IF NOT EXISTS orders_user_idempotency_key_unique
             ON orders (user_id, idempotency_key) WHERE idempotency_key IS NOT NULL'
        );
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS orders_user_idempotency_key_unique');

        Schema::table('orders', function (Blueprint $table): void {
            if (Schema::hasColumn('orders', 'idempotency_key')) {
                $table->dropColumn('idempotency_key');
            }
        });
    }
};
