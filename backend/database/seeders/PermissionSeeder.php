<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seeds the canonical permission catalog and the default role→permission
 * matrix. Admins can grant/revoke at runtime through /api/admin/rbac.
 */
class PermissionSeeder extends Seeder
{
    /**
     * Canonical module.resource.action catalog (spec §9) — single source
     * of truth, mirrored by AdminRbacController::permissions() (groups on
     * the first dot, so 3-segment names round-trip as module + action).
     *
     * Naming rules:
     *  - Entity modules double the entity (users.users.view, orders.orders.refund).
     *  - Console-wide view/manage on vertical modules => {module}.overview.{action}.
     *  - Sub-resource actions keep their resource (support.tickets.assign,
     *    inventory.stock.view, kyc.applications.review, cms.pages.publish …).
     */
    public const CATALOG = [
        'products.products.view', 'products.products.create', 'products.products.update', 'products.products.delete', 'products.products.publish', 'products.products.approve',
        'orders.orders.view', 'orders.orders.create', 'orders.orders.update', 'orders.orders.manage', 'orders.orders.refund', 'orders.orders.cancel',
        'users.users.view', 'users.users.create', 'users.users.update', 'users.users.delete', 'users.users.suspend', 'users.users.activate',
        'users.permissions.manage',
        'vendors.vendors.view', 'vendors.vendors.approve', 'vendors.vendors.suspend', 'vendors.vendors.commission', 'vendors.vendors.manage',
        'healthcare.overview.view', 'healthcare.doctors.manage', 'healthcare.appointments.view', 'healthcare.appointments.create', 'healthcare.appointments.manage', 'healthcare.records.view', 'healthcare.prescriptions.manage', 'healthcare.labs.manage', 'healthcare.aid.view', 'healthcare.aid.manage', 'healthcare.content.view', 'healthcare.content.manage',
        'learn.overview.view', 'learn.courses.manage', 'learn.courses.create', 'learn.lessons.manage', 'learn.certificates.issue', 'learn.quizzes.manage', 'learn.posts.review',
        'hotels.overview.view', 'hotels.overview.manage', 'hotels.rooms.manage', 'hotels.reservations.view', 'hotels.reservations.manage',
        'food.overview.view', 'food.overview.manage', 'food.orders.view', 'food.orders.manage', 'food.menu.manage',
        'jobs.overview.view', 'jobs.jobs.create', 'jobs.overview.manage', 'jobs.applications.view', 'jobs.applications.manage',
        'job_seekers.overview.view', 'job_seekers.overview.manage', 'job_seekers.requests.manage',
        'real_estate.overview.view', 'real_estate.overview.manage', 'real_estate.inquiries.manage',
        'rides.overview.view', 'rides.overview.manage', 'rides.drivers.manage', 'rides.flights.manage',
        'transport.overview.view', 'transport.overview.manage', 'transport.requests.manage',
        'agriculture.overview.view', 'agriculture.overview.manage', 'agriculture.products.manage', 'agriculture.workers.manage',
        'building_services.overview.view', 'building_services.overview.manage', 'building_services.workers.manage', 'building_services.bookings.manage',
        'needs.overview.view', 'needs.requests.create', 'needs.overview.manage', 'needs.offers.manage', 'needs.requests.view',
        'tasks.overview.view', 'tasks.tasks.create', 'tasks.overview.manage', 'tasks.applications.manage', 'tasks.submissions.verify',
        'pharmacy.overview.view', 'pharmacy.overview.manage', 'pharmacy.medicines.manage', 'pharmacy.prescriptions.view', 'pharmacy.prescriptions.manage',
        'messaging.overview.view', 'messaging.conversations.manage',
        'notifications.overview.view', 'notifications.overview.manage',
        'reviews.reviews.view', 'reviews.reviews.create', 'reviews.reviews.moderate', 'reviews.reviews.delete',
        'delivery.deliveries.view', 'delivery.deliveries.manage', 'delivery.deliveries.track',
        'inventory.stock.view', 'inventory.stock.manage', 'inventory.movements.view',
        'categories.categories.view', 'categories.categories.manage',
        'deals.deals.view', 'deals.deals.manage',
        'subscriptions.subscriptions.view', 'subscriptions.subscriptions.manage',
        'payments.payments.view', 'payments.payments.manage',
        'analytics.overview.view', 'analytics.overview.export',
        'audit.logs.view', 'audit.logs.export',
        'support.overview.view', 'support.tickets.view', 'support.tickets.manage', 'support.tickets.create', 'support.tickets.assign', 'support.tickets.transfer', 'support.tickets.escalate', 'support.tickets.resolve',
        'cms.pages.view', 'cms.pages.manage', 'cms.pages.publish',
        'finance.overview.view', 'finance.payments.manage', 'finance.refunds.process', 'finance.payouts.manage', 'finance.transactions.view',
        'settings.overview.view', 'settings.system.update', 'settings.features.manage',
        'kyc.applications.view', 'kyc.applications.review',
        'departments.departments.view', 'departments.departments.manage',
        'reports.reports.view', 'reports.reports.export',
        // Spec S64 2-segment aliases (resolve to the canonical 3-segment grants).
        'users.view', 'users.manage',
        'products.view', 'products.manage', 'products.publish',
        'orders.view', 'orders.manage',
        'healthcare.view', 'healthcare.manage',
        'doctors.view', 'doctors.manage',
        'learn.view', 'learn.manage', 'learn.publish',
        'cms.view', 'cms.manage', 'cms.publish',
        'wallet.view', 'wallet.manage',
        'kyc.view', 'kyc.manage',
        'payments.view', 'payments.manage', 'payments.refund',
        'settings.view', 'settings.manage',
        'rbac.view', 'rbac.manage',
        'audit.view',
        // No-code platform (spec S40-S47, S105-S106).
        'cms.blocks.view', 'cms.blocks.manage', 'cms.blocks.publish',
        'cms.revisions.view', 'cms.revisions.manage', 'cms.revisions.restore',
        'navigation.view', 'navigation.manage',
        'forms.view', 'forms.manage', 'forms.respond',
        'media.view', 'media.manage',
        'modules.view', 'modules.manage',
        // Admin-defined service catalogue (spec 39/100).
        'services.overview.view', 'services.overview.manage',
    ];

    /**
     * Default matrix: role => permission prefixes granted (prefix.* grants
     * every action on that module).
     */
    private const MATRIX = [
        'super_admin' => ['*'],
        // L1 — platform-wide operations (no finance/security/content powers).
        'platform_ops' => [
            'orders.*', 'vendors.*', 'products.*', 'inventory.*',
            'categories.*', 'delivery.*', 'needs.*', 'tasks.*',
        ],
        // L1 — security posture: KYC, audit, account suspension (no role grants,
        // no settings writes).
        'security_admin' => [
            'kyc.*', 'audit.*',
            'users.users.view', 'users.users.update', 'users.users.suspend', 'users.users.activate',
            'settings.overview.view',
        ],
        // L1 — reporting/analytics owner.
        'analytics_admin' => ['analytics.*', 'reports.*'],
'administrator' => [
  'products.*', 'orders.*', 'users.users.view', 'users.users.create', 'users.users.update', 'users.users.suspend',
            'vendors.*', 'healthcare.*', 'learn.*', 'hotels.*', 'food.*', 'jobs.*', 'job_seekers.*',
            'real_estate.*', 'rides.*', 'transport.*', 'agriculture.*', 'building_services.*',
            'needs.*', 'tasks.*', 'pharmacy.*', 'messaging.*', 'notifications.*', 'reviews.*',
            'delivery.*', 'inventory.*', 'categories.*', 'deals.*', 'subscriptions.*', 'payments.*',
            'analytics.*', 'audit.*', 'support.*', 'cms.*', 'finance.*', 'settings.*', 'departments.*', 'reports.*',
            'kyc.*',
            'navigation.*', 'forms.*', 'media.*', 'modules.*', 'services.*',
        ],
        // L2 — domain console owners.
        'orders_admin' => ['orders.*', 'delivery.*'],
        'wallet_admin' => ['payments.*', 'finance.transactions.view', 'finance.payouts.manage'],
        'support_admin' => ['support.*', 'messaging.*', 'departments.*'],
        'real_estate_admin' => ['real_estate.*'],
        'needs_admin' => ['needs.*', 'tasks.*'],
        // L3 — verification/review roles (least privilege).
        'payout_reviewer' => ['finance.payouts.manage', 'finance.transactions.view'],
        'refund_agent' => ['orders.orders.view', 'orders.orders.refund', 'finance.refunds.process'],
        'inventory_manager' => ['inventory.*'],
        'cms_editor' => ['cms.pages.view', 'cms.pages.manage', 'cms.blocks.*', 'cms.revisions.*', 'navigation.view', 'media.view', 'media.manage'],
        'auditor' => ['audit.*', 'reports.*'],
        'analyst' => ['analytics.overview.view', 'reports.reports.view'],
        'vendor_admin' => ['products.products.create', 'products.products.update', 'products.products.view', 'orders.orders.view', 'orders.orders.manage', 'inventory.stock.view', 'inventory.stock.manage'],
        'moderator' => ['products.products.view', 'products.products.approve', 'categories.categories.view', 'orders.orders.view', 'cms.pages.view', 'cms.blocks.view', 'support.overview.view', 'reviews.reviews.moderate', 'learn.posts.review'],
        'support_agent' => ['support.*', 'orders.orders.view', 'users.users.view', 'messaging.overview.view'],
        'content_manager' => ['cms.*', 'cms.blocks.*', 'cms.revisions.*', 'navigation.*', 'forms.*', 'media.*', 'modules.*', 'learn.*', 'products.products.view'],
        'finance_admin' => ['finance.*', 'orders.orders.view', 'orders.orders.refund', 'analytics.overview.view', 'audit.logs.view', 'payments.payments.view'],
        'healthcare_admin' => ['healthcare.*', 'pharmacy.overview.view', 'pharmacy.prescriptions.view', 'support.overview.view', 'users.users.view'],
        'learning_admin' => ['learn.*', 'cms.pages.view', 'cms.blocks.view', 'cms.blocks.manage'],
        'customer_service' => ['support.*', 'orders.orders.view', 'users.users.view', 'messaging.overview.view'],
        'marketplace_admin' => ['products.products.view', 'products.products.approve', 'categories.categories.view', 'categories.categories.manage', 'orders.orders.view'],
        // Spec §65 named admin roles (collections of permissions, least privilege).
        'category_admin' => ['categories.*', 'products.products.view'],
        'vendor_manager' => ['vendors.*', 'products.products.view'],
        'content_admin' => ['cms.*', 'navigation.*', 'media.*'],
        'hotel_admin' => ['hotels.*', 'support.overview.view'],
        'food_admin' => ['food.*', 'orders.orders.view', 'support.overview.view'],
        'transport_admin' => ['rides.*', 'transport.*', 'delivery.deliveries.view'],
        'agriculture_admin' => ['agriculture.*', 'products.products.view'],
        'building_admin' => ['building_services.*', 'real_estate.overview.view'],
        'jobs_admin' => ['jobs.*', 'job_seekers.*'],
        'pharmacy_admin' => ['pharmacy.*', 'healthcare.overview.view'],
        'kyc_reviewer' => ['kyc.*'],
        'learning_reviewer' => ['learn.posts.review'],
        'worker' => [],
        'user' => [],
    ];

    public function run(): void
    {
        // Normalize the matrix (drop accidental non-string entries)
        $matrix = array_map(
            fn ($perms) => array_values(array_filter($perms, 'is_string')),
            self::MATRIX,
        );

        foreach ($matrix as $role => $grants) {
            if ($grants === ['*']) {
                $rows = array_map(fn ($p) => [
                    'id' => (string) \Illuminate\Support\Str::uuid(),
                    'role' => $role,
                    'permission' => $p,
                    'created_at' => now(),
                    'updated_at' => now(),
                ], self::CATALOG);

                DB::table('role_permissions')->where('role', $role)->delete();
                DB::table('role_permissions')->insert($rows);

                continue;
            }

            DB::table('role_permissions')->where('role', $role)->delete();

            $resolved = [];
            foreach ($grants as $grant) {
                if (str_ends_with($grant, '.*')) {
                    $prefix = substr($grant, 0, -2) . '.';
                    foreach (self::CATALOG as $perm) {
                        if (str_starts_with($perm, $prefix)) {
                            $resolved[] = $perm;
                        }
                    }
                } elseif (in_array($grant, self::CATALOG, true)) {
                    $resolved[] = $grant;
                }
            }

            $resolved = array_unique($resolved);
            if ($resolved !== []) {
                DB::table('role_permissions')->insert(array_map(fn ($p) => [
                    'id' => (string) \Illuminate\Support\Str::uuid(),
                    'role' => $role,
                    'permission' => $p,
                    'created_at' => now(),
                    'updated_at' => now(),
                ], array_values($resolved)));
            }
        }

        \Illuminate\Support\Facades\Cache::forget('rbac.matrix');
    }
}
