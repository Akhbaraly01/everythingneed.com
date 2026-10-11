<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave N (spec 58 REAL ESTATE + spec 59 BUILDING SERVICES):
 *
 * - Properties gain the sale/rent listing type the API already validates.
 * - Building service bookings gain the worker assignment the spec requires
 *   to be real (plus a quoted price for the quote step).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('properties', function (Blueprint $blueprint): void {
            $blueprint->string('listing_type', 10)->default('sale');
        });

        Schema::table('building_service_bookings', function (Blueprint $table): void {
            $table->uuid('worker_id')->nullable()->after('id');
            $table->foreign('worker_id')->references('id')->on('service_workers')->nullOnDelete();
            $table->decimal('quoted_price', 12, 2)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('building_service_bookings', function (Blueprint $table): void {
            $table->dropForeign(['worker_id']);
            $table->dropColumn(['worker_id', 'quoted_price']);
        });

        Schema::table('properties', function (Blueprint $blueprint): void {
            $blueprint->dropColumn('listing_type');
        });
    }
};
