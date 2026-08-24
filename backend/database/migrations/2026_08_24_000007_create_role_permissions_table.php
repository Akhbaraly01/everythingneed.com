<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('role_permissions')) {
            Schema::create('role_permissions', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('role', 40)->index();
                $table->string('permission', 80);
                $table->timestamps();

                $table->unique(['role', 'permission']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('role_permissions');
    }
};
