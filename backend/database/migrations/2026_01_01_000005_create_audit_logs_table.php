<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('action');
            $table->string('entity_type');
            $table->string('entity_id');
            $table->string('performed_by');
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->timestamp('created_at');
            $table->index(['entity_type', 'entity_id']);
            $table->index('performed_by');
            $table->index('action');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
