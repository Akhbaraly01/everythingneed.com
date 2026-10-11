<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('sku')->nullable();
            $table->string('currency', 3)->default('USD');
            $table->decimal('tax_rate', 5, 2)->default(0);
            $table->decimal('discount_percent', 5, 2)->default(0);
            $table->boolean('featured')->default(false);
            $table->string('publication_state', 20)->default('published');
            $table->json('specifications')->nullable();
            $table->json('attributes')->nullable();
            $table->json('shipping')->nullable();

            $table->index('publication_state');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['publication_state']);
            $table->dropColumn([
                'sku',
                'currency',
                'tax_rate',
                'discount_percent',
                'featured',
                'publication_state',
                'specifications',
                'attributes',
                'shipping',
            ]);
        });
    }
};
