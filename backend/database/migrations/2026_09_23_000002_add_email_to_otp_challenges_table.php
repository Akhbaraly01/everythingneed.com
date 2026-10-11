<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('otp_challenges', function (Blueprint $table) {
            $table->string('email', 255)->nullable()->after('phone');
            $table->index('email');
        });
    }

    public function down(): void
    {
        Schema::table('otp_challenges', function (Blueprint $table) {
            $table->dropIndex(['email']);
            $table->dropColumn('email');
        });
    }
};
