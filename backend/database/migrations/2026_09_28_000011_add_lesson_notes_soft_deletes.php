<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave L follow-up: lesson_notes needs the deleted_at column the base
 * model (SoftDeletes) queries on every read.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lesson_notes', function (Blueprint $blueprint): void {
            $blueprint->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('lesson_notes', function (Blueprint $blueprint): void {
            $blueprint->dropSoftDeletes();
        });
    }
};
