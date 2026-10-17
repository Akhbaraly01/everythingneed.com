<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * TODO 10 discovery indexes: marketplace filters always scope by status
 * (+ visibility for requests) before ordering by recency/budget.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('need_requests', function (Blueprint $table) {
            $table->index(['status', 'visibility', 'created_at'], 'need_requests_discovery_idx');
            $table->index(['category_id', 'status'], 'need_requests_category_status_idx');
        });

        Schema::table('task_posts', function (Blueprint $table) {
            $table->index(['status', 'created_at'], 'task_posts_discovery_idx');
        });

        Schema::table('need_items', function (Blueprint $table) {
            $table->index(['status', 'is_available', 'category_id'], 'need_items_discovery_idx');
        });
    }

    public function down(): void
    {
        Schema::table('need_items', function (Blueprint $table) {
            $table->dropIndex('need_items_discovery_idx');
        });

        Schema::table('task_posts', function (Blueprint $table) {
            $table->dropIndex('task_posts_discovery_idx');
        });

        Schema::table('need_requests', function (Blueprint $table) {
            $table->dropIndex('need_requests_discovery_idx');
            $table->dropIndex('need_requests_category_status_idx');
        });
    }
};
