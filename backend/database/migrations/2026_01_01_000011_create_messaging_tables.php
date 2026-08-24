<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('ticket_number')->unique();
            $table->string('subject');
            $table->text('description');
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->enum('status', ['open', 'in_progress', 'pending', 'resolved', 'closed'])->default('open');
            $table->uuid('assigned_to')->nullable();
            $table->uuid('department_id')->nullable();
            $table->timestamps();
            $table->index('user_id');
            $table->index('status');
            $table->index('priority');
        });

        Schema::create('ticket_messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('ticket_id')->constrained()->cascadeOnDelete();
            $table->uuid('sender_id')->constrained('users')->cascadeOnDelete();
            $table->text('message');
            $table->boolean('is_internal')->default(false);
            $table->timestamp('created_at');
            $table->index('ticket_id');
        });

        Schema::create('chat_conversations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('customer_id')->constrained('users')->cascadeOnDelete();
            $table->uuid('worker_id')->nullable()->constrained('users')->nullOnDelete();
            $table->uuid('booking_id')->nullable();
            $table->timestamps();
            $table->index('customer_id');
            $table->index('worker_id');
        });

        Schema::create('chat_messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('conversation_id')->constrained()->cascadeOnDelete();
            $table->uuid('sender_id')->constrained('users')->cascadeOnDelete();
            $table->text('message');
            $table->string('message_type')->default('text');
            $table->boolean('is_read')->default(false);
            $table->timestamp('created_at');
            $table->index('conversation_id');
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('message');
            $table->string('type');
            $table->uuid('related_id')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamp('created_at');
            $table->index('user_id');
            $table->index('is_read');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('chat_messages');
        Schema::dropIfExists('chat_conversations');
        Schema::dropIfExists('ticket_messages');
        Schema::dropIfExists('tickets');
    }
};
