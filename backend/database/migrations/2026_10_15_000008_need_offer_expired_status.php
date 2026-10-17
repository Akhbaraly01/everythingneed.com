<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * TODO 12 follow-up (found by NeedOfferLifecycleTest, not assumed):
 *  - need_offers status vocabulary gains 'expired' (the original CHECK only
 *    allowed pending/accepted/rejected/withdrawn);
 *  - need_offer_revisions gains deleted_at (the base model soft-deletes).
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE need_offers DROP CONSTRAINT IF EXISTS need_offers_status_check');
        DB::statement("ALTER TABLE need_offers ADD CONSTRAINT need_offers_status_check CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn', 'expired'))");

        Schema::table('need_offer_revisions', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('need_offer_revisions', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        DB::statement('ALTER TABLE need_offers DROP CONSTRAINT IF EXISTS need_offers_status_check');
        DB::statement("ALTER TABLE need_offers ADD CONSTRAINT need_offers_status_check CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn'))");
    }
};
