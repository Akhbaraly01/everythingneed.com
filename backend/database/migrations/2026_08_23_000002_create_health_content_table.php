<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('health_content')) {
            Schema::create('health_content', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('type', 40)->index(); // video | document | category | prevention_guide
                $table->string('title');
                $table->string('slug')->unique();
                $table->text('summary')->nullable();
                $table->text('body')->nullable();
                $table->string('url')->nullable();
                $table->string('thumbnail_url')->nullable();
                $table->string('specialty')->nullable()->index();
                $table->unsignedInteger('duration_minutes')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->softDeletes();

                $table->index(['type', 'is_active']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('health_content');
    }
};
