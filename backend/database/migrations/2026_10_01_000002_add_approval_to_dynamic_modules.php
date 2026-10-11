<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * W3: optional moderation for no-code dynamic modules. Modules flagged
 * requires_approval route published-intent entries through the generic
 * ApprovalEngine instead of publishing directly.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dynamic_modules', function (Blueprint $table): void {
            if (!Schema::hasColumn('dynamic_modules', 'requires_approval')) {
                $table->boolean('requires_approval')->default(false)->after('status');
            }
            if (!Schema::hasColumn('dynamic_modules', 'approval_roles')) {
                $table->jsonb('approval_roles')->nullable()->after('requires_approval');
            }
        });
    }

    public function down(): void
    {
        Schema::table('dynamic_modules', function (Blueprint $table): void {
            foreach (['approval_roles', 'requires_approval'] as $column) {
                if (Schema::hasColumn('dynamic_modules', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
