<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * H-B: close the prescription -> pharmacy gap. Orders can now reference the
 * prescription they fulfil (so a filled status can be written back on
 * delivery), and prescriptions gain an explicit expiry so the active/filled/
 * expired lifecycle is real rather than aspirational.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('medicine_orders', function (Blueprint $table) {
            $table->uuid('prescription_id')->nullable()->after('prescription_url')->index();
            $table->foreign('prescription_id')->references('id')->on('prescriptions')
                ->nullOnDelete();
        });

        Schema::table('prescriptions', function (Blueprint $table) {
            $table->timestamp('expires_at')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('medicine_orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('prescription_id');
        });

        Schema::table('prescriptions', function (Blueprint $table) {
            $table->dropColumn('expires_at');
        });
    }
};
