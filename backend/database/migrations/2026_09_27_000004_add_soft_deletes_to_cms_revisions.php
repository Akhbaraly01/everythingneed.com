<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave C - cms_revisions extends the shared Uuid7Model base, which carries
 * the SoftDeletes trait, but the Wave B table shipped without a deleted_at
 * column (the first revision row ever created surfaced it). Additive fix so
 * every CmsRevision query can apply the soft-delete scope; retention
 * pruning force-deletes, so history is either kept or genuinely pruned.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cms_revisions', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('cms_revisions', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
