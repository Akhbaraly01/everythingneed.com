<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * W2 reversible RBAC state: grants are flipped between granted/denied
 * instead of deleted, so every grant/revoke keeps its audit trail and a
 * denied row explicitly overrides (least-privilege safe).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('role_permissions', function (Blueprint $table): void {
            if (!Schema::hasColumn('role_permissions', 'state')) {
                $table->string('state', 10)->default('granted')->after('permission');
            }
            if (!Schema::hasColumn('role_permissions', 'granted_by')) {
                $table->uuid('granted_by')->nullable()->after('state');
            }
            if (!Schema::hasColumn('role_permissions', 'note')) {
                $table->string('note', 255)->nullable()->after('granted_by');
            }
        });

        Schema::table('user_permissions', function (Blueprint $table): void {
            if (!Schema::hasColumn('user_permissions', 'state')) {
                $table->string('state', 10)->default('granted')->after('permission');
            }
        });
    }

    public function down(): void
    {
        Schema::table('role_permissions', function (Blueprint $table): void {
            foreach (['note', 'granted_by', 'state'] as $column) {
                if (Schema::hasColumn('role_permissions', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::table('user_permissions', function (Blueprint $table): void {
            if (Schema::hasColumn('user_permissions', 'state')) {
                $table->dropColumn('state');
            }
        });
    }
};
