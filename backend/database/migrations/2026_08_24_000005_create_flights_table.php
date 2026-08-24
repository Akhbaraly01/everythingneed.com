<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('flights')) {
            Schema::create('flights', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('flight_number', 12)->unique();
                $table->string('airline');
                $table->string('origin_city');
                $table->string('origin_code', 4);
                $table->string('destination_city');
                $table->string('destination_code', 4);
                $table->time('departure_time');
                $table->time('arrival_time');
                $table->unsignedInteger('duration_minutes');
                $table->decimal('price', 10, 2);
                $table->unsignedInteger('seats_total')->default(180);
                $table->unsignedInteger('seats_available')->default(180);
                $table->json('days_of_week'); // [0..6]
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->softDeletes();

                $table->index(['origin_code', 'destination_code']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('flights');
    }
};
