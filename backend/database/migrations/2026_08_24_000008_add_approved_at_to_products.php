<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('products', 'approved_at')) {
            Schema::table('products', function (Blueprint $table) {
                $table->timestamp('approved_at')->nullable()->after('is_active');
                $table->index('approved_at');
            });

            // Existing catalogue was already live — grandfather it in as approved.
            DB::table('products')
                ->whereNull('approved_at')
                ->update(['approved_at' => now()]);
        }

        if (!Schema::hasTable('rejected_products')) {
            Schema::create('rejected_products', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('product_id')->index();
                $table->string('reason', 1000)->nullable();
                $table->uuid('created_by')->nullable();
                $table->timestamp('created_at')->nullable();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('rejected_products');

        if (Schema::hasColumn('products', 'approved_at')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropIndex(['approved_at']);
                $table->dropColumn('approved_at');
            });
        }
    }
};
