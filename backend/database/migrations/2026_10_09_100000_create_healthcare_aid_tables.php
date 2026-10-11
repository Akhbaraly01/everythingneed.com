<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('aid_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('description');
            $table->string('category')->nullable();
            $table->decimal('goal_amount', 10, 2);
            $table->decimal('raised_amount', 10, 2)->default(0);
            $table->char('currency', 3)->default('USD');
            // pending|approved|rejected|funded|closed
            $table->string('status')->default('pending');
            $table->uuid('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->string('idempotency_key')->nullable()->unique();
            $table->timestamps();
            $table->softDeletes();
            $table->index('status');
            $table->index('category');
            $table->index('user_id');
        });

        Schema::create('aid_donations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('aid_request_id')->constrained('aid_requests')->cascadeOnDelete();
            $table->uuid('donor_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->char('currency', 3)->default('USD');
            $table->uuid('payment_id')->nullable();
            $table->string('status')->default('completed'); // completed|failed
            $table->timestamps();
            $table->softDeletes();
            $table->index('aid_request_id');
            $table->index('donor_id');
        });

        // One honest donation per donor per request - blocks double
        // submits and doubles as the idempotency backstop. Must run
        // after the table exists (outside the Schema::create closure).
        DB::statement(
            'CREATE UNIQUE INDEX aid_donations_donor_request_unique
             ON aid_donations (aid_request_id, donor_id)'
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('aid_donations');
        Schema::dropIfExists('aid_requests');
    }
};
