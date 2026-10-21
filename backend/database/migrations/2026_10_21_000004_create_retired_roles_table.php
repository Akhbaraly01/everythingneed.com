<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Retired built-in roles.
 *
 * Canonical roles live in the AppRole enum, so they cannot be removed
 * from the code base at runtime. A super admin can still take a built-in
 * role out of service: the row here hides it from the console and every
 * role picker, and the role's grants/scopes are dropped. Un-retiring
 * restores the role and its seeded default permissions.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('retired_roles')) {
            return;
        }

        Schema::create('retired_roles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            // Canonical role slug (AppRole), within the 40-char budget.
            $table->string('role', 40)->unique();
            $table->string('reason', 255)->nullable();
            $table->uuid('retired_by')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('retired_roles');
    }
};
