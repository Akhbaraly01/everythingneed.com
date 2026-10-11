<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Learn 2.0 course lifecycle (Phase L-B): draft/published/archived so the
 * admin console can unpublish a course without hard-deleting it. Existing
 * rows are already live in every surface, so they seed as published with
 * published_at = created_at; new admin creates keep spec-47 behaviour
 * (live immediately) via the column default.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table): void {
            $table->string('status', 20)->default('published');
            $table->timestamp('published_at')->nullable();
            $table->index('status');
        });

        DB::table('courses')
            ->whereNull('published_at')
            ->update(['published_at' => DB::raw('created_at')]);
    }

    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table): void {
            $table->dropIndex(['status']);
            $table->dropColumn(['status', 'published_at']);
        });
    }
};
