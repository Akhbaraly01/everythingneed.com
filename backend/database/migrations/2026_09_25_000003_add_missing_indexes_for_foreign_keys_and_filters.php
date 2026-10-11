<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds the missing indexes for foreign-key columns and hot status filters
 * identified during Iteration 27 (modularization + performance pass).
 *
 * - Every index is guarded with Schema::hasTable() / hasColumn() / hasIndex()
 *   so the migration is idempotent and safe on any database state.
 * - FK *constraints* are intentionally not added here: existing production-like
 *   data may contain orphans, and a failed constraint would block deploys.
 *   Indexes deliver the query-plan benefit without that risk.
 */
return new class extends Migration
{
    /** @var list<array{table: string, columns: list<string>, name: string}> */
    private const INDEXES = [
        // --- Foreign-key lookups (owner/join filters) ---
        ['table' => 'carts', 'columns' => ['user_id'], 'name' => 'carts_user_id_index'],
        ['table' => 'profiles', 'columns' => ['user_id'], 'name' => 'profiles_user_id_index'],
        ['table' => 'doctors', 'columns' => ['user_id'], 'name' => 'doctors_user_id_index'],
        ['table' => 'drivers', 'columns' => ['user_id'], 'name' => 'drivers_user_id_index'],
        ['table' => 'restaurants', 'columns' => ['user_id'], 'name' => 'restaurants_user_id_index'],
        ['table' => 'service_workers', 'columns' => ['user_id'], 'name' => 'service_workers_user_id_index'],
        ['table' => 'delivery_managers', 'columns' => ['user_id'], 'name' => 'delivery_managers_user_id_index'],
        ['table' => 'support_tickets', 'columns' => ['user_id'], 'name' => 'support_tickets_user_id_index'],
        ['table' => 'tickets', 'columns' => ['department_id'], 'name' => 'tickets_department_id_index'],
        ['table' => 'expert_availability', 'columns' => ['expert_id'], 'name' => 'expert_availability_expert_id_index'],
        ['table' => 'expert_reviews', 'columns' => ['user_id'], 'name' => 'expert_reviews_user_id_index'],
        ['table' => 'categories', 'columns' => ['parent_id'], 'name' => 'categories_parent_id_index'],
        ['table' => 'need_items', 'columns' => ['vendor_id'], 'name' => 'need_items_vendor_id_index'],
        ['table' => 'food_orders', 'columns' => ['restaurant_id'], 'name' => 'food_orders_restaurant_id_index'],
        ['table' => 'food_order_items', 'columns' => ['menu_item_id'], 'name' => 'food_order_items_menu_item_id_index'],
        ['table' => 'hotel_reservations', 'columns' => ['hotel_id'], 'name' => 'hotel_reservations_hotel_id_index'],
        ['table' => 'hotel_reservations', 'columns' => ['hotel_id', 'room_id'], 'name' => 'hotel_reservations_hotel_id_room_id_index'],
        ['table' => 'medicine_order_items', 'columns' => ['medicine_id'], 'name' => 'medicine_order_items_medicine_id_index'],
        ['table' => 'payments', 'columns' => ['order_id'], 'name' => 'payments_order_id_index'],
        ['table' => 'bookings', 'columns' => ['service_id'], 'name' => 'bookings_service_id_index'],
        ['table' => 'wallet_holds', 'columns' => ['order_id'], 'name' => 'wallet_holds_order_id_index'],
        ['table' => 'vendor_withdrawals', 'columns' => ['vendor_id'], 'name' => 'vendor_withdrawals_vendor_id_index'],
        ['table' => 'vendor_commissions', 'columns' => ['vendor_id', 'order_id'], 'name' => 'vendor_commissions_vendor_id_order_id_index'],
        ['table' => 'user_certificates', 'columns' => ['course_id'], 'name' => 'user_certificates_course_id_index'],
        ['table' => 'order_items', 'columns' => ['variant_id'], 'name' => 'order_items_variant_id_index'],
        ['table' => 'invoices', 'columns' => ['user_id'], 'name' => 'invoices_user_id_index'],
        ['table' => 'chat_conversations', 'columns' => ['booking_id'], 'name' => 'chat_conversations_booking_id_index'],
        ['table' => 'vehicles', 'columns' => ['driver_id'], 'name' => 'vehicles_driver_id_index'],
        ['table' => 'order_tracking', 'columns' => ['vendor_id'], 'name' => 'order_tracking_vendor_id_index'],
        ['table' => 'analytics_events', 'columns' => ['entity_id'], 'name' => 'analytics_events_entity_id_index'],

        // --- Hot status filters (list screens, queues, summaries) ---
        ['table' => 'bookings', 'columns' => ['status'], 'name' => 'bookings_status_index'],
        ['table' => 'building_service_bookings', 'columns' => ['status'], 'name' => 'building_service_bookings_status_index'],
        ['table' => 'cms_blog_posts', 'columns' => ['status'], 'name' => 'cms_blog_posts_status_index'],
        ['table' => 'cms_pages', 'columns' => ['status'], 'name' => 'cms_pages_status_index'],
        ['table' => 'food_orders', 'columns' => ['status'], 'name' => 'food_orders_status_index'],
        ['table' => 'hotel_reservations', 'columns' => ['status'], 'name' => 'hotel_reservations_status_index'],
        ['table' => 'invoices', 'columns' => ['status'], 'name' => 'invoices_status_index'],
        ['table' => 'job_applications', 'columns' => ['status'], 'name' => 'job_applications_status_index'],
        ['table' => 'learn_posts', 'columns' => ['status'], 'name' => 'learn_posts_status_index'],
        ['table' => 'need_offers', 'columns' => ['status'], 'name' => 'need_offers_status_index'],
        ['table' => 'order_tracking', 'columns' => ['status'], 'name' => 'order_tracking_status_index'],
        ['table' => 'support_tickets', 'columns' => ['status'], 'name' => 'support_tickets_status_index'],
        ['table' => 'vendor_commissions', 'columns' => ['status'], 'name' => 'vendor_commissions_status_index'],
        ['table' => 'vendor_withdrawals', 'columns' => ['status'], 'name' => 'vendor_withdrawals_status_index'],
        ['table' => 'viewing_requests', 'columns' => ['status'], 'name' => 'viewing_requests_status_index'],
        ['table' => 'work_offers', 'columns' => ['status'], 'name' => 'work_offers_status_index'],
    ];

    public function up(): void
    {
        foreach (self::INDEXES as $plan) {
            $table = $plan['table'];

            if (! Schema::hasTable($table)) {
                continue;
            }

            $columns = array_values(array_filter(
                $plan['columns'],
                fn (string $column) => Schema::hasColumn($table, $column),
            ));

            if ($columns === [] || Schema::hasIndex($table, $plan['name'])) {
                continue;
            }

            Schema::table($table, function (Blueprint $blueprint) use ($columns, $plan) {
                $blueprint->index($columns, $plan['name']);
            });
        }
    }

    public function down(): void
    {
        foreach (self::INDEXES as $plan) {
            $table = $plan['table'];

            if (Schema::hasTable($table) && Schema::hasIndex($table, $plan['name'])) {
                Schema::table($table, function (Blueprint $blueprint) use ($plan) {
                    $blueprint->dropIndex($plan['name']);
                });
            }
        }
    }
};
