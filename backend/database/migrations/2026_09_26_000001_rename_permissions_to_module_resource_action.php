<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Renames every legacy 2-segment permission (module.action) in
 * role_permissions to the canonical 3-segment format (module.resource.action)
 * defined by PermissionSeeder::CATALOG (spec §9).
 *
 * New installs never see the old strings (PermissionSeeder seeds the new
 * catalog directly); this migration keeps deployed databases consistent so
 * grants survive the rename instead of silently dropping out of the matrix.
 */
return new class extends Migration
{
    /**
     * old => new (single source: keep in sync with PermissionSeeder::CATALOG).
     * Modules whose console-wide actions became {module}.overview.*, entity
     * modules that doubled (users.users.view …), and sub-resource renames
     * (support.assign => support.tickets.assign …).
     *
     * @var array<string, string>
     */
    private const RENAME = [
        // Entity modules — canonical doubling.
        'products.view' => 'products.products.view',
        'products.create' => 'products.products.create',
        'products.update' => 'products.products.update',
        'products.delete' => 'products.products.delete',
        'products.publish' => 'products.products.publish',
        'products.approve' => 'products.products.approve',
        'orders.view' => 'orders.orders.view',
        'orders.create' => 'orders.orders.create',
        'orders.update' => 'orders.orders.update',
        'orders.manage' => 'orders.orders.manage',
        'orders.refund' => 'orders.orders.refund',
        'orders.cancel' => 'orders.orders.cancel',
        'users.view' => 'users.users.view',
        'users.create' => 'users.users.create',
        'users.update' => 'users.users.update',
        'users.delete' => 'users.users.delete',
        'users.suspend' => 'users.users.suspend',
        'users.activate' => 'users.users.activate',
        'vendors.view' => 'vendors.vendors.view',
        'vendors.approve' => 'vendors.vendors.approve',
        'vendors.suspend' => 'vendors.vendors.suspend',
        'vendors.commission' => 'vendors.vendors.commission',
        'vendors.manage' => 'vendors.vendors.manage',
        'reviews.view' => 'reviews.reviews.view',
        'reviews.create' => 'reviews.reviews.create',
        'reviews.moderate' => 'reviews.reviews.moderate',
        'reviews.delete' => 'reviews.reviews.delete',
        'deals.view' => 'deals.deals.view',
        'deals.manage' => 'deals.deals.manage',
        'subscriptions.view' => 'subscriptions.subscriptions.view',
        'subscriptions.manage' => 'subscriptions.subscriptions.manage',
        'payments.view' => 'payments.payments.view',
        'payments.manage' => 'payments.payments.manage',
        'departments.view' => 'departments.departments.view',
        'departments.manage' => 'departments.departments.manage',
        'reports.view' => 'reports.reports.view',
        'reports.export' => 'reports.reports.export',
        'categories.view' => 'categories.categories.view',
        'categories.manage' => 'categories.categories.manage',

        // Vertical modules — console-wide actions => {module}.overview.*.
        'healthcare.view' => 'healthcare.overview.view',
        'learn.view' => 'learn.overview.view',
        'hotels.view' => 'hotels.overview.view',
        'hotels.manage' => 'hotels.overview.manage',
        'food.view' => 'food.overview.view',
        'food.manage' => 'food.overview.manage',
        'jobs.view' => 'jobs.overview.view',
        'jobs.manage' => 'jobs.overview.manage',
        'job_seekers.view' => 'job_seekers.overview.view',
        'job_seekers.manage' => 'job_seekers.overview.manage',
        'real_estate.view' => 'real_estate.overview.view',
        'real_estate.manage' => 'real_estate.overview.manage',
        'rides.view' => 'rides.overview.view',
        'rides.manage' => 'rides.overview.manage',
        'transport.view' => 'transport.overview.view',
        'transport.manage' => 'transport.overview.manage',
        'agriculture.view' => 'agriculture.overview.view',
        'agriculture.manage' => 'agriculture.overview.manage',
        'building_services.view' => 'building_services.overview.view',
        'building_services.manage' => 'building_services.overview.manage',
        'needs.view' => 'needs.overview.view',
        'needs.manage' => 'needs.overview.manage',
        'tasks.view' => 'tasks.overview.view',
        'tasks.manage' => 'tasks.overview.manage',
        'pharmacy.view' => 'pharmacy.overview.view',
        'pharmacy.manage' => 'pharmacy.overview.manage',
        'messaging.view' => 'messaging.overview.view',
        'notifications.view' => 'notifications.overview.view',
        'notifications.manage' => 'notifications.overview.manage',
        'analytics.view' => 'analytics.overview.view',
        'analytics.export' => 'analytics.overview.export',
        'finance.view' => 'finance.overview.view',
        'settings.view' => 'settings.overview.view',
        'support.view' => 'support.overview.view',

        // Entity-level creates inside vertical modules.
        'jobs.create' => 'jobs.jobs.create',
        'needs.create' => 'needs.requests.create',
        'tasks.create' => 'tasks.tasks.create',

        // Sub-resource renames.
        'delivery.view' => 'delivery.deliveries.view',
        'delivery.manage' => 'delivery.deliveries.manage',
        'delivery.track' => 'delivery.deliveries.track',
        'inventory.view' => 'inventory.stock.view',
        'inventory.manage' => 'inventory.stock.manage',
        'support.assign' => 'support.tickets.assign',
        'support.transfer' => 'support.tickets.transfer',
        'support.escalate' => 'support.tickets.escalate',
        'support.resolve' => 'support.tickets.resolve',
        'cms.view' => 'cms.pages.view',
        'cms.manage' => 'cms.pages.manage',
        'cms.publish' => 'cms.pages.publish',
        'kyc.view' => 'kyc.applications.view',
        'kyc.review' => 'kyc.applications.review',
        'audit.view' => 'audit.logs.view',
        'audit.export' => 'audit.logs.export',
    ];

    public function up(): void
    {
        foreach (self::RENAME as $old => $new) {
            DB::table('role_permissions')->where('permission', $old)->update(['permission' => $new]);
        }

        Cache::forget('rbac.matrix');
    }

    public function down(): void
    {
        foreach (array_flip(self::RENAME) as $new => $old) {
            DB::table('role_permissions')->where('permission', $new)->update(['permission' => $old]);
        }

        Cache::forget('rbac.matrix');
    }
};
