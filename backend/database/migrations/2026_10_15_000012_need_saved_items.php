<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * TODO 18 customer workspace: saved listings/searches (providers follow
 * with the public directory in TODO 19).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('need_saved_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->index();
            $table->string('item_type', 20)->index();
            $table->uuid('item_id')->nullable()->index();
            $table->json('query')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'item_type', 'item_id'], 'need_saved_owner_type_item_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('need_saved_items');
    }
};
