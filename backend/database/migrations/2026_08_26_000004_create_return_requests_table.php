<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('return_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('order_id')->constrained()->cascadeOnDelete();
            $table->uuid('order_item_id')->nullable();
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('vendor_id')->nullable();
            $table->string('reason');
            $table->text('description')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected', 'received', 'refunded'])->default('pending');
            $table->decimal('refund_amount', 12, 2)->nullable();
            $table->string('admin_notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index('order_id');
            $table->index('user_id');
            $table->index('vendor_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('return_requests');
    }
};
