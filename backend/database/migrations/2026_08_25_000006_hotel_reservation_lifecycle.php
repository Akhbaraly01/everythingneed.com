<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hotel_reservations', function (Blueprint $table) {
            if (!Schema::hasColumn('hotel_reservations', 'reference')) {
                $table->string('reference', 20)->nullable()->after('id');
            }
            if (!Schema::hasColumn('hotel_reservations', 'checked_in_at')) {
                $table->timestamp('checked_in_at')->nullable();
            }
            if (!Schema::hasColumn('hotel_reservations', 'checked_out_at')) {
                $table->timestamp('checked_out_at')->nullable();
            }
        });

        // Backfill references for existing confirmed reservations.
        $rows = DB::table('hotel_reservations')->whereNull('reference')->get();

        foreach ($rows as $row) {
            DB::table('hotel_reservations')
                ->where('id', $row->id)
                ->update(['reference' => 'HTR-'.strtoupper(Str::random(6))]);
        }

        Schema::table('hotel_reservations', function (Blueprint $table) {
            if (Schema::hasColumn('hotel_reservations', 'reference')) {
                $table->unique('reference');
            }
        });

        // Widen the status CHECK to cover the stay lifecycle (§14).
        DB::statement("ALTER TABLE hotel_reservations DROP CONSTRAINT IF EXISTS hotel_reservations_status_check");
        DB::statement("ALTER TABLE hotel_reservations ADD CONSTRAINT hotel_reservations_status_check ".
            "CHECK (status IN ('pending','confirmed','checked_in','checked_out','completed','cancelled'))");
    }

    public function down(): void
    {
        Schema::table('hotel_reservations', function (Blueprint $table) {
            foreach (['reference', 'checked_in_at', 'checked_out_at'] as $col) {
                if (Schema::hasColumn('hotel_reservations', $col)) {
                    if ($col === 'reference') {
                        // Drop the unique index implicitly with the column.
                    }
                    $table->dropColumn($col);
                }
            }
        });
    }
};
