<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Wave H (spec 31 PAYMENTS): every payment carries a purpose, and the
 * workflow gains the missing 'cancelled' state (pending/processing can be
 * abandoned) while keeping the legacy 'completed' value that finance
 * reporting still counts as revenue.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $blueprint): void {
            $blueprint->string('purpose')->nullable()->after('method');
        });

        DB::statement('ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check');
        DB::statement(
            "ALTER TABLE payments ADD CONSTRAINT payments_status_check CHECK (status IN ("
            . "'pending', 'processing', 'succeeded', 'completed', 'failed', 'cancelled',"
            . " 'refunded', 'partially_refunded'"
            . '))'
        );
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check');
        DB::statement(
            "ALTER TABLE payments ADD CONSTRAINT payments_status_check CHECK (status IN ("
            . "'pending', 'processing', 'succeeded', 'completed', 'failed', 'refunded', 'partially_refunded'"
            . '))'
        );

        Schema::table('payments', function (Blueprint $blueprint): void {
            $blueprint->dropColumn('purpose');
        });
    }
};
