<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave R (spec §109) — indexes for the hottest read paths: audit-trail
 * ordering/filters, payment + order windows, user growth, and the
 * notification unread badge.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('audit_logs', function (Blueprint $table): void {
            $table->index('created_at');
        });
        Schema::table('payments', function (Blueprint $table): void {
            $table->index(['status', 'created_at']);
        });
        Schema::table('users', function (Blueprint $table): void {
            $table->index('created_at');
        });
        Schema::table('vendor_orders', function (Blueprint $table): void {
            $table->index('created_at');
        });
        Schema::table('notifications', function (Blueprint $table): void {
            $table->index(['user_id', 'is_read']);
        });
    }

    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table): void {
            $table->dropIndex(['created_at']);
        });
        Schema::table('payments', function (Blueprint $table): void {
            $table->dropIndex(['status', 'created_at']);
        });
        Schema::table('users', function (Blueprint $table): void {
            $table->dropIndex(['created_at']);
        });
        Schema::table('vendor_orders', function (Blueprint $table): void {
            $table->dropIndex(['created_at']);
        });
        Schema::table('notifications', function (Blueprint $table): void {
            $table->dropIndex(['user_id', 'is_read']);
        });
    }
};
