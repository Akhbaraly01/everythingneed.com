<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('audit_logs', 'performed_by')) {
            // Drop any non-uuid values before converting the column type
            DB::statement("UPDATE audit_logs SET performed_by = NULL WHERE performed_by !~* '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'");
            DB::statement('ALTER TABLE audit_logs ALTER COLUMN performed_by DROP DEFAULT');
            DB::statement('ALTER TABLE audit_logs ALTER COLUMN performed_by TYPE uuid USING NULLIF(performed_by, \'\')::uuid');
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('audit_logs', 'performed_by')) {
            DB::statement('ALTER TABLE audit_logs ALTER COLUMN performed_by TYPE varchar USING performed_by::text');
        }
    }
};
