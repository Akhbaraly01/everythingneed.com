<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_roles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('role');
            $table->uuid('category_id')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'role']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_roles');
    }
};
