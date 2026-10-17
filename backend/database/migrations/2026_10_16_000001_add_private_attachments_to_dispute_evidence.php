<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dispute_evidence', function (Blueprint $table) {
            $table->string('disk', 20)->default('public')->after('file_url');
            $table->string('file_path', 500)->nullable()->after('disk');
            $table->string('original_filename', 255)->nullable()->after('file_path');
            $table->timestamp('signed_url_expires_at')->nullable()->after('original_filename');
        });
    }

    public function down(): void
    {
        Schema::table('dispute_evidence', function (Blueprint $table) {
            $table->dropColumn(['disk', 'file_path', 'original_filename', 'signed_url_expires_at']);
        });
    }
};