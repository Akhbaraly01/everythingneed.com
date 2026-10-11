<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('viewing_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('property_id');
            $table->uuid('user_id');
            $table->string('name');
            $table->string('email');
            $table->string('phone', 30);
            $table->text('message');
            $table->date('viewing_date')->nullable();
            $table->string('status', 20)->default('pending');
            $table->timestamps();
            $table->index('property_id');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('viewing_requests');
    }
};
