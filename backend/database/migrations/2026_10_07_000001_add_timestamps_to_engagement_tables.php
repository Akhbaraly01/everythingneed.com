<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * EngagementController's wishlist/favorites endpoints reference columns the
 * original tables never had: wishlist() orders by created_at, addToWishlist
 * inserts entity_type + created_at, toggleFavorite inserts created_at.
 * (recently_viewed already carries viewed_at; its query is fixed in the
 * controller to order by viewed_at.) TableGateway's conditional hasColumn
 * writes start populating these columns once they exist.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('wishlists', function (Blueprint $table) {
            $table->string('entity_type')->default('product');
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

        Schema::table('favorites', function (Blueprint $table) {
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

        // Existing rows predate the timestamps - keep ordering deterministic.
        foreach (['wishlists', 'favorites'] as $tableName) {
            DB::table($tableName)
                ->whereNull('created_at')
                ->update(['created_at' => now(), 'updated_at' => now()]);
        }
    }

    public function down(): void
    {
        Schema::table('wishlists', function (Blueprint $table) {
            $table->dropColumn(['entity_type', 'created_at', 'updated_at']);
        });

        Schema::table('favorites', function (Blueprint $table) {
            $table->dropColumn(['created_at', 'updated_at']);
        });
    }
};
