<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * W1.6 — permission scopes layered on the role matrix / per-user grants.
 *
 * A scope row narrows HOW a holder (role or user) may see rows for a
 * permission. Absence of a row = global (unrestricted) — zero behavior
 * change until a scope is granted. Scope values:
 *   global | own | vendor | domain  -> enforced now (ScopeFilter)
 *   team | country | region         -> architectured, enforcement deferred
 *                                      (documented in AUDIT_MATRIX.md)
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('permission_scopes')) {
            return;
        }

        Schema::create('permission_scopes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('holder_type', 10);   // 'role' | 'user'
            $table->string('holder_id', 40);     // AppRole value or user uuid
            $table->string('permission', 80);
            $table->string('scope', 20);
            $table->string('scope_value', 100)->nullable(); // domain key (dept id, category...)
            $table->timestamps();

            $table->unique(['holder_type', 'holder_id', 'permission']);
            $table->index(['permission', 'scope']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permission_scopes');
    }
};
