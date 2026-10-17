<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Phase 4: tamper-evident audit trail. `sequence` totally orders rows
     * (uuid PKs are unordered); each row chains the previous hash, so any
     * edit/delete/reorder breaks verification (audit:verify-chain).
     */
    public function up(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->text('prev_hash')->nullable();
            $table->text('hash')->nullable();
        });

        DB::statement('ALTER TABLE audit_logs ADD COLUMN sequence BIGINT GENERATED ALWAYS AS IDENTITY');
        DB::statement('CREATE INDEX IF NOT EXISTS audit_logs_sequence_idx ON audit_logs (sequence)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropColumn(['prev_hash', 'hash', 'sequence']);
        });
    }
};
