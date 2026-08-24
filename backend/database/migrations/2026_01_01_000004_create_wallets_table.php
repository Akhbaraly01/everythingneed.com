<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wallets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->decimal('balance', 12, 2)->default(0);
            $table->string('currency', 3)->default('USD');
            $table->timestamps();
            $table->unique('user_id');
        });

        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('wallet_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['credit', 'debit']);
            $table->decimal('amount', 12, 2);
            $table->decimal('balance_after', 12, 2);
            $table->string('reference');
            $table->string('description')->nullable();
            $table->timestamp('created_at');
            $table->index(['wallet_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wallet_transactions');
        Schema::dropIfExists('wallets');
    }
};
