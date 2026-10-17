<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * N-27 live availability: providers pause their visibility without
 * touching vetting status. Default true keeps every existing profile
 * visible to matching and auto-match push.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('need_provider_profiles', function (Blueprint $table) {
            $table->boolean('is_available')->default(true)->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('need_provider_profiles', function (Blueprint $table) {
            $table->dropColumn('is_available');
        });
    }
};
