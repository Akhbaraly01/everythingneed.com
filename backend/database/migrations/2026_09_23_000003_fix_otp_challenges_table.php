<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('otp_challenges', function (Blueprint $table) {
            // Email challenges carry no phone number.
            $table->string('phone', 30)->nullable()->change();
            // Base model uses SoftDeletes; the original table missed the column.
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('otp_challenges', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
