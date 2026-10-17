<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Phase 2: AES-256-GCM ciphertext (~base64 JSON envelope) does not fit the
 * legacy narrow columns. Widen PII targets to TEXT (PostgreSQL-only
 * project; raw ALTER avoids the doctrine/dbal dependency).
 *
 * No data conversion: existing plaintext values remain valid text.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement('ALTER TABLE kyc_verifications ALTER COLUMN document_number TYPE text');
        DB::statement('ALTER TABLE kyc_verifications ALTER COLUMN full_name TYPE text');
        DB::statement('ALTER TABLE kyc_verifications ALTER COLUMN date_of_birth TYPE text USING date_of_birth::text');
        DB::statement('ALTER TABLE kyc_verifications ALTER COLUMN nationality TYPE text');
        DB::statement('ALTER TABLE payments ALTER COLUMN gateway_response TYPE text USING gateway_response::text');
        DB::statement('ALTER TABLE payments ALTER COLUMN metadata TYPE text USING metadata::text');
        DB::statement('ALTER TABLE refunds ALTER COLUMN gateway_response TYPE text USING gateway_response::text');
    }

    /**
     * Reverse the migrations.
     *
     * Intentionally a no-op: narrowing back would truncate or reject
     * ciphertext (jsonb cast fails on non-JSON payloads). Widening is
     * data-preserving in both directions of content; the types stay text.
     */
    public function down(): void
    {
    }
};
