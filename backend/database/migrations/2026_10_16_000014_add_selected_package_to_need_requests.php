<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * N-22 gig packages: a request that grew out of a chosen listing tier
 * remembers WHICH listing and WHICH tier it was (server-resolved price
 * snapshot) so scope changes and disputes compare against the original
 * offer, not against whatever the gig page says later.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('need_requests', function (Blueprint $table) {
            $table->uuid('selected_listing_id')->nullable()->after('category_id');
            $table->json('selected_package')->nullable()->after('selected_listing_id');
            $table->index('selected_listing_id');
        });
    }

    public function down(): void
    {
        Schema::table('need_requests', function (Blueprint $table) {
            $table->dropIndex(['selected_listing_id']);
            $table->dropColumn(['selected_listing_id', 'selected_package']);
        });
    }
};
