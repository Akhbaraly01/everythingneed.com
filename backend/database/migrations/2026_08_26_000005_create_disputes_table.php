<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('disputes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('order_id')->nullable()->constrained()->nullOnDelete();
            $table->string('subject');
            $table->text('description');
            $table->enum('status', ['open', 'in_review', 'resolved', 'closed'])->default('open');
            $table->enum('resolution', ['none', 'refund', 'replacement', 'credit', 'dismissed'])->default('none');
            $table->uuid('assigned_to')->nullable();
            $table->text('resolution_notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index('order_id');
            $table->index('user_id');
            $table->index('status');
            $table->index('assigned_to');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('disputes');
    }
};
