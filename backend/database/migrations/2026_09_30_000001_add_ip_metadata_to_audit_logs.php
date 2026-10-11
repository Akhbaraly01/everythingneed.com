<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('audit_logs', function (Blueprint $table): void {
            if (!Schema::hasColumn('audit_logs', 'ip_address')) {
                $table->string('ip_address', 45)->nullable()->after('performed_by');
            }
            if (!Schema::hasColumn('audit_logs', 'metadata')) {
                $table->json('metadata')->nullable()->after('new_values');
            }
        });
    }

    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table): void {
            if (Schema::hasColumn('audit_logs', 'ip_address')) {
                $table->dropColumn('ip_address');
            }
            if (Schema::hasColumn('audit_logs', 'metadata')) {
                $table->dropColumn('metadata');
            }
        });
    }
};
