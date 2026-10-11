<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Wave K (spec 23 DOCTOR BOOKING + spec 25 PHARMACY):
 *
 * - A partial unique index makes double booking impossible at the database
 *   level: the same doctor/date/time can only have one live ticket.
 *   Cancelled and completed tickets (plus undated ones) never conflict.
 * - Medicines gain the vendor/detail columns the admin API already
 *   validates, so catalog management actually persists.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement(
            "CREATE UNIQUE INDEX IF NOT EXISTS health_tickets_doctor_slot_unique
             ON health_tickets (doctor_id, appointment_date, appointment_time)
             WHERE doctor_id IS NOT NULL
               AND appointment_date IS NOT NULL
               AND appointment_time IS NOT NULL
               AND status NOT IN ('cancelled', 'completed')"
        );

        Schema::table('medicines', function (Blueprint $blueprint): void {
            $blueprint->uuid('vendor_id')->nullable()->after('id');
            $blueprint->foreign('vendor_id')->references('id')->on('vendors')->nullOnDelete();
            $blueprint->string('dosage_form')->nullable();
            $blueprint->string('strength')->nullable();
            $blueprint->string('manufacturer')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('medicines', function (Blueprint $blueprint): void {
            $blueprint->dropForeign(['vendor_id']);
            $blueprint->dropColumn(['vendor_id', 'dosage_form', 'strength', 'manufacturer']);
        });

        DB::statement('DROP INDEX IF EXISTS health_tickets_doctor_slot_unique');
    }
};
