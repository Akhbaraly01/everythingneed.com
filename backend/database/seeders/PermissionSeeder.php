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
     * module.action catalog — mirrors the AdminRbacController catalog but
     * flattened into granular `module.action` strings.
     */
    public const CATALOG = [
        'products.view', 'products.create', 'products.update', 'products.delete', 'products.publish', 'products.approve',
        'orders.view', 'orders.create', 'orders.update', 'orders.manage', 'orders.refund', 'orders.cancel',
        'users.view', 'users.create', 'users.update', 'users.delete', 'users.suspend', 'users.activate',
        'vendors.view', 'vendors.approve', 'vendors.suspend', 'vendors.commission', 'vendors.manage',
        'healthcare.view', 'healthcare.doctors.manage', 'healthcare.appointments.view', 'healthcare.appointments.create', 'healthcare.appointments.manage', 'healthcare.records.view', 'healthcare.prescriptions.manage', 'healthcare.labs.manage',
        'learn.view', 'learn.courses.manage', 'learn.courses.create', 'learn.lessons.manage', 'learn.certificates.issue', 'learn.quizzes.manage',
        'hotels.view', 'hotels.manage', 'hotels.rooms.manage', 'hotels.reservations.view', 'hotels.reservations.manage',
        'food.view', 'food.manage', 'food.orders.view', 'food.orders.manage', 'food.menu.manage',
        'jobs.view', 'jobs.create', 'jobs.manage', 'jobs.applications.view', 'jobs.applications.manage',
        'job_seekers.view', 'job_seekers.manage', 'job_seekers.requests.manage',
        'real_estate.view', 'real_estate.manage', 'real_estate.inquiries.manage',
        'rides.view', 'rides.manage', 'rides.drivers.manage', 'rides.flights.manage',
        'transport.view', 'transport.manage', 'transport.requests.manage',
        'agriculture.view', 'agriculture.manage', 'agriculture.products.manage', 'agriculture.workers.manage',
        'building_services.view', 'building_services.manage', 'building_services.workers.manage', 'building_services.bookings.manage',
        'needs.view', 'needs.create', 'needs.manage', 'needs.offers.manage', 'needs.requests.view',
        'tasks.view', 'tasks.create', 'tasks.manage', 'tasks.applications.manage', 'tasks.submissions.verify',
        'pharmacy.view', 'pharmacy.manage', 'pharmacy.medicines.manage', 'pharmacy.prescriptions.view', 'pharmacy.prescriptions.manage',
        'messaging.view', 'messaging.conversations.manage',
        'notifications.view', 'notifications.manage',
        'reviews.view', 'reviews.create', 'reviews.moderate', 'reviews.delete',
        'delivery.view', 'delivery.manage', 'delivery.track',
        'inventory.view', 'inventory.manage', 'inventory.movements.view',
        'categories.view', 'categories.manage',
        'deals.view', 'deals.manage',
        'subscriptions.view', 'subscriptions.manage',
        'payments.view', 'payments.manage',
        'analytics.view', 'analytics.export',
        'audit.view', 'audit.export',
        'support.view', 'support.tickets.view', 'support.tickets.manage', 'support.tickets.create', 'support.assign', 'support.transfer', 'support.escalate', 'support.resolve',
        'cms.view', 'cms.manage', 'cms.publish',
        'finance.view', 'finance.payments.manage', 'finance.refunds.process', 'finance.payouts.manage', 'finance.transactions.view',
        'settings.view', 'settings.system.update', 'settings.features.manage',
        'departments.view', 'departments.manage',
        'reports.view', 'reports.export',
    ];

    /**
     * Default matrix: role => permission prefixes granted (prefix.* grants
     * every action on that module).
     */
    private const MATRIX = [
        'super_admin' => ['*'],
        'administrator' => [
            'products.*', 'orders.*', 'users.view', 'users.update', 'users.suspend',
            'vendors.*', 'healthcare.*', 'learn.*', 'hotels.*', 'food.*', 'jobs.*', 'job_seekers.*',
            'real_estate.*', 'rides.*', 'transport.*', 'agriculture.*', 'building_services.*',
            'needs.*', 'tasks.*', 'pharmacy.*', 'messaging.*', 'notifications.*', 'reviews.*',
            'delivery.*', 'inventory.*', 'categories.*', 'deals.*', 'subscriptions.*', 'payments.*',
            'analytics.*', 'audit.*', 'support.*', 'cms.*', 'finance.*', 'settings.*', 'departments.*', 'reports.*',
        ],
        'vendor_admin' => ['products.create', 'products.update', 'products.view', 'orders.view', 'orders.manage', 'inventory.view', 'inventory.manage'],
        'moderator' => ['products.view', 'products.approve', 'cms.view', 'support.view', 'reviews.moderate'],
        'support_staff' => ['support.*', 'orders.view', 'users.view', 'messaging.view'],
        'content_manager' => ['cms.*', 'learn.*', 'products.view'],
        'finance_admin' => ['finance.*', 'orders.view', 'orders.refund', 'analytics.view', 'audit.view', 'payments.view'],
        'healthcare_admin' => ['healthcare.*', 'pharmacy.view', 'pharmacy.prescriptions.view', 'support.view', 'users.view'],
        'learning_admin' => ['learn.*', 'cms.view'],
        'customer_service' => ['support.*', 'orders.view', 'users.view', 'messaging.view'],
        'category_admin' => ['products.view', 'products.approve', 'categories.view', 'orders.view'],
        'hotel_admin' => ['hotels.*', 'bookings.*', 'support.view'],
        'food_admin' => ['food.*', 'orders.view', 'support.view'],
        'transport_admin' => ['rides.*', 'transport.*', 'delivery.view'],
        'agriculture_admin' => ['agriculture.*', 'products.view'],
        'building_admin' => ['building_services.*', 'real_estate.view'],
        'jobs_admin' => ['jobs.*', 'job_seekers.*'],
        'pharmacy_admin' => ['pharmacy.*', 'healthcare.view'],
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
    }
}
