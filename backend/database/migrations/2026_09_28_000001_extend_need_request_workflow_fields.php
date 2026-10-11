<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Wave F (spec S13): widen the need_requests lifecycle to the full
 * spec vocabulary (Draft -> Submitted -> Published -> Offers Received ->
 * Negotiation -> Accepted -> Payment Pending -> Paid -> Processing ->
 * Fulfilled -> Completed, plus Cancelled/Rejected/Expired/Disputed/
 * Refunded) and add the spec S11 submission columns.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('need_requests', function (Blueprint $table) {
            if (!Schema::hasColumn('need_requests', 'subcategory')) {
                $table->string('subcategory')->nullable();
            }
            if (!Schema::hasColumn('need_requests', 'quantity')) {
                $table->unsignedInteger('quantity')->nullable();
            }
            if (!Schema::hasColumn('need_requests', 'currency')) {
                $table->string('currency', 3)->default('USD');
            }
            if (!Schema::hasColumn('need_requests', 'country')) {
                $table->string('country')->nullable();
            }
            if (!Schema::hasColumn('need_requests', 'preferred_date')) {
                $table->date('preferred_date')->nullable();
            }
            if (!Schema::hasColumn('need_requests', 'images')) {
                $table->json('images')->nullable();
            }
            if (!Schema::hasColumn('need_requests', 'service_requirements')) {
                $table->text('service_requirements')->nullable();
            }
            if (!Schema::hasColumn('need_requests', 'delivery_requirements')) {
                $table->text('delivery_requirements')->nullable();
            }
            if (!Schema::hasColumn('need_requests', 'notes')) {
                $table->text('notes')->nullable();
            }
        });

        // The status column is a Postgres CHECK (Laravel enum) - widen it to
        // the full spec lifecycle without touching the stored rows.
        DB::statement('ALTER TABLE need_requests DROP CONSTRAINT IF EXISTS need_requests_status_check');
        DB::statement(
            "ALTER TABLE need_requests ADD CONSTRAINT need_requests_status_check CHECK (status = ANY (ARRAY[" .
            "'draft','pending','published','reviewing','offered','negotiating','accepted','payment_pending'," .
            "'paid','in_progress','fulfilled','completed','cancelled','rejected','expired','disputed','refunded'" .
            "]::text[]))"
        );
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE need_requests DROP CONSTRAINT IF EXISTS need_requests_status_check');
        DB::statement(
            "ALTER TABLE need_requests ADD CONSTRAINT need_requests_status_check CHECK (status = ANY (ARRAY[" .
            "'pending','reviewing','offered','accepted','paid','in_progress','completed','cancelled'" .
            "]::text[]))"
        );

        Schema::table('need_requests', function (Blueprint $table) {
            foreach ([
                'subcategory', 'quantity', 'currency', 'country', 'preferred_date',
                'images', 'service_requirements', 'delivery_requirements', 'notes',
            ] as $column) {
                if (Schema::hasColumn('need_requests', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
