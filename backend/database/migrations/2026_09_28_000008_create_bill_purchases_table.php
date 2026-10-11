<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave J (spec 30 FINANCIAL SERVICES): bill purchases - every utility
 * purchase is a first-class row with its own idempotency key, status and
 * provider reference. Money movement stays in the wallet ledger; the
 * provider only vends.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bill_purchases', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->index();
            $table->string('service', 30)->index();
            $table->string('provider', 30);
            $table->char('country', 2);
            $table->char('currency', 3);
            $table->decimal('amount', 12, 2);
            $table->json('account_fields');
            $table->string('reference')->unique();
            $table->string('idempotency_key')->nullable()->unique();
            $table->string('status', 20)->default('pending')->index();
            $table->string('provider_reference')->nullable();
            $table->json('provider_response')->nullable();
            $table->boolean('wallet_refunded')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bill_purchases');
    }
};
