<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('feature_flags')) {
            return;
        }

        Schema::create('feature_flags', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('key')->unique()->index();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('enabled')->default(false);
            $table->boolean('kill_switch')->default(false);
            $table->json('conditions')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feature_flags');
    }
};
