<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Backlog #2: private file uploads store disk paths, not public URLs
        // — file_url becomes nullable (legacy URL rows keep their value).
        DB::statement('ALTER TABLE dispute_evidence ALTER COLUMN file_url DROP NOT NULL');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE dispute_evidence ALTER COLUMN file_url SET NOT NULL');
    }
};