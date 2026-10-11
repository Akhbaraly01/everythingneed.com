<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('doctors', function (Blueprint $table) {
            $table->string('profession')->default('doctor')->after('specialization');
            $table->decimal('home_visit_fee', 10, 2)->nullable()->after('virtual_fee');
            $table->index('profession');
        });

        Schema::table('health_tickets', function (Blueprint $table) {
            $table->string('home_address')->nullable()->after('appointment_time');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('health_tickets', function (Blueprint $table) {
            $table->dropColumn('home_address');
        });

        Schema::table('doctors', function (Blueprint $table) {
            $table->dropColumn(['profession', 'home_visit_fee']);
            $table->dropIndex(['profession']);
        });
    }
};