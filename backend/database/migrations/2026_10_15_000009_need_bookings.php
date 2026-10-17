<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * TODO 13 scheduling + booking. At most one live booking per request
 * (partial unique index — cancelled slots free the request for rebooking);
 * provider overlap is checked under a row lock at write time. UI availability
 * checks alone are never sufficient.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('need_bookings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            // No plain unique: a cancelled slot frees the request for rebooking.
            // The partial index below enforces at most one LIVE booking.
            $table->uuid('need_request_id')->index();
            $table->uuid('provider_id')->index();
            $table->uuid('booked_by');
            // Naive UTC wall time (see controller): immune to the database
            // session timezone, which this box does not pin to UTC.
            $table->dateTime('scheduled_start')->index();
            $table->dateTime('scheduled_end');
            $table->string('timezone', 60)->default('UTC');
            $table->string('status', 20)->default('scheduled')->index();
            $table->text('cancel_reason')->nullable();
            $table->unsignedInteger('reschedule_count')->default(0);
            $table->timestamps();
            $table->softDeletes();
            $table->foreign('need_request_id')->references('id')->on('need_requests')->cascadeOnDelete();
        });

        // At most one LIVE booking per request: concurrent double-submits
        // collide here even if both pass the application guard. Cancelled
        // rows stay out of the index, so rebooking after cancel works.
        \Illuminate\Support\Facades\DB::statement(
            "CREATE UNIQUE INDEX need_bookings_live_request_unique ON need_bookings (need_request_id) WHERE status = 'scheduled' AND deleted_at IS NULL"
        );
    }

    public function down(): void
    {
        \Illuminate\Support\Facades\DB::statement('DROP INDEX IF EXISTS need_bookings_live_request_unique');

        Schema::dropIfExists('need_bookings');
    }
};
