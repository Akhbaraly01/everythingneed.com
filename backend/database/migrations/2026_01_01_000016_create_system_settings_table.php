<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('system_settings')) {
            return;
        }

        Schema::create('system_settings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('key')->unique()->index();
            $table->text('value')->nullable();
            $table->string('group')->default('general');
            $table->string('type')->default('string');
            $table->uuid('updated_by')->nullable();
            $table->timestamps();

            $table->index('group');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};
