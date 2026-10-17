<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * N-29 cost guides: Thumbtack/Angi-style discovery content. Per-category
 * price ranges + factors + FAQs, admin-managed, publicly readable.
 * Doubles as the estimator data source for N-35 quote calculators.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('need_cost_guides', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('need_category_id')->index();
            $table->string('slug', 160)->unique();
            $table->string('title', 180);
            $table->text('summary');
            $table->decimal('price_min', 12, 2)->nullable();
            $table->decimal('price_max', 12, 2)->nullable();
            $table->decimal('price_avg', 12, 2)->nullable();
            $table->string('currency', 3)->default('USD');
            $table->string('pricing_unit', 20)->default('project');
            $table->json('factors')->nullable();
            $table->json('faqs')->nullable();
            $table->string('source_note', 300)->nullable();
            $table->string('status', 20)->default('draft');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'need_category_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('need_cost_guides');
    }
};
