<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Mega-phase M-1: link catalogue services to the new taxonomy while
        // the legacy free-text `category` stays for backward compatibility
        // (existing filters/search keep matching it; the admin syncs it to
        // the category name on save).
        Schema::table('service_definitions', function (Blueprint $table) {
            $table->uuid('category_id')->nullable()->after('category');

            $table->foreign('category_id')->references('id')->on('service_categories')->nullOnDelete();
            $table->index('category_id');
        });
    }

    public function down(): void
    {
        Schema::table('service_definitions', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->dropIndex(['category_id']);
            $table->dropColumn('category_id');
        });
    }
};
