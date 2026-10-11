<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave G (spec §34): the vendor system lists vendor services - a real,
 * vendor-owned service catalog with customer-facing visibility at
 * /vendors/{slug}/services and vendor management at /vendor/services.
 * Bookings against these rows live in the existing `bookings` table with
 * service_type = 'vendor_service'.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendor_services', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('vendor_id')->constrained('vendors')->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('price', 12, 2)->default(0);
            $table->unsignedInteger('duration_minutes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            $table->index('vendor_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_services');
    }
};
