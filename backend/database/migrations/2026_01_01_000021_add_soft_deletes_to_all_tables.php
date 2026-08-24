<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $tables = [
            'addresses', 'analytics_events', 'audit_logs', 'bookings',
            'building_service_bookings', 'cart_items', 'cart_items_v2', 'carts',
            'categories', 'chat_conversations', 'chat_messages', 'coupons',
            'course_lessons', 'courses', 'delivery_managers', 'departments',
            'doctors', 'drivers', 'enrollments', 'expert_availability',
            'expert_reviews', 'expert_wishlists', 'favorites', 'feature_flags',
            'food_order_items', 'food_orders', 'health_tickets', 'hotel_reservations',
            'hotel_rooms', 'hotels', 'invoices', 'job_applications', 'job_posts',
            'learn_direct_messages', 'learn_post_comments', 'learn_post_likes',
            'learn_posts', 'medicine_order_items', 'medicine_orders', 'medicines',
            'menu_items', 'need_categories', 'need_items', 'notifications',
            'order_tracking', 'payments', 'plans', 'product_reviews', 'products',
            'properties', 'recently_viewed', 'refunds', 'restaurants', 'review_votes',
            'reviews', 'rides', 'service_workers', 'stock_levels', 'stock_movements',
            'subscriptions', 'system_settings', 'ticket_messages', 'tickets',
            'user_certificates', 'user_settings', 'vehicles', 'vendor_orders',
            'vendors', 'video_progress', 'wallet_transactions', 'wishlists',
        ];

        foreach ($tables as $tbl) {
            if (Schema::hasTable($tbl) && !Schema::hasColumn($tbl, 'deleted_at')) {
                Schema::table($tbl, function (Blueprint $blueprint) use ($tbl) {
                    $blueprint->softDeletes();
                });
            }
        }
    }

    public function down(): void
    {
        $tables = [
            'addresses', 'analytics_events', 'audit_logs', 'bookings',
            'building_service_bookings', 'cart_items', 'cart_items_v2', 'carts',
            'categories', 'chat_conversations', 'chat_messages', 'coupons',
            'course_lessons', 'courses', 'delivery_managers', 'departments',
            'doctors', 'drivers', 'enrollments', 'expert_availability',
            'expert_reviews', 'expert_wishlists', 'favorites', 'feature_flags',
            'food_order_items', 'food_orders', 'health_tickets', 'hotel_reservations',
            'hotel_rooms', 'hotels', 'invoices', 'job_applications', 'job_posts',
            'learn_direct_messages', 'learn_post_comments', 'learn_post_likes',
            'learn_posts', 'medicine_order_items', 'medicine_orders', 'medicines',
            'menu_items', 'need_categories', 'need_items', 'notifications',
            'order_tracking', 'payments', 'plans', 'product_reviews', 'products',
            'properties', 'recently_viewed', 'refunds', 'restaurants', 'review_votes',
            'reviews', 'rides', 'service_workers', 'stock_levels', 'stock_movements',
            'subscriptions', 'system_settings', 'ticket_messages', 'tickets',
            'user_certificates', 'user_settings', 'vehicles', 'vendor_orders',
            'vendors', 'video_progress', 'wallet_transactions', 'wishlists',
        ];

        foreach ($tables as $tbl) {
            if (Schema::hasTable($tbl) && Schema::hasColumn($tbl, 'deleted_at')) {
                Schema::table($tbl, function (Blueprint $blueprint) use ($tbl) {
                    $blueprint->dropSoftDeletes();
                });
            }
        }
    }
};
