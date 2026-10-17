<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * TODO 12 offers + quotations: quotation detail fields, expiry, and an
 * append-only revision log so re-submits never overwrite history.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('need_offers', function (Blueprint $table) {
            $table->text('scope_of_work')->nullable();
            $table->text('deliverables')->nullable();
            $table->text('exclusions')->nullable();
            $table->string('estimated_duration', 120)->nullable();
            $table->text('terms')->nullable();
            $table->timestamp('expires_at')->nullable()->index();
            $table->unsignedInteger('revision_no')->default(1);
        });

        Schema::create('need_offer_revisions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('need_offer_id')->index();
            $table->unsignedInteger('revision_no');
            $table->decimal('price', 12, 2);
            $table->text('message')->nullable();
            $table->text('scope_of_work')->nullable();
            $table->text('deliverables')->nullable();
            $table->text('exclusions')->nullable();
            $table->string('estimated_duration', 120)->nullable();
            $table->text('terms')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->unique(['need_offer_id', 'revision_no']);
            $table->foreign('need_offer_id')->references('id')->on('need_offers')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('need_offer_revisions');

        Schema::table('need_offers', function (Blueprint $table) {
            $table->dropColumn([
                'scope_of_work', 'deliverables', 'exclusions',
                'estimated_duration', 'terms', 'expires_at', 'revision_no',
            ]);
        });
    }
};
