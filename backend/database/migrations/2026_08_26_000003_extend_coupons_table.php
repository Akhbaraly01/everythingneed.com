<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('coupons', function (Blueprint $table) {
            $table->integer('per_user_limit')->nullable()->after('max_uses');
            $table->json('applicable_categories')->nullable()->after('per_user_limit');
            $table->uuid('applicable_product_id')->nullable()->after('applicable_categories');
            $table->foreign('applicable_product_id')->references('id')->on('products')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('coupons', function (Blueprint $table) {
            $table->dropForeign(['applicable_product_id']);
            $table->dropColumn(['per_user_limit', 'applicable_categories', 'applicable_product_id']);
        });
    }
};
