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
        'products.view', 'products.create', 'products.update', 'products.delete', 'products.approve',
        'orders.view', 'orders.manage', 'orders.refund', 'orders.cancel',
        'users.view', 'users.create', 'users.update', 'users.delete', 'users.suspend',
        'vendors.view', 'vendors.approve', 'vendors.suspend', 'vendors.commission',
        'healthcare.view', 'healthcare.doctors.manage', 'healthcare.appointments.manage', 'healthcare.records.view',
        'learn.view', 'learn.courses.manage', 'learn.certificates.issue',
        'hotels.view', 'hotels.manage',
        'food.view', 'food.manage',
        'jobs.view', 'jobs.manage',
        'real_estate.view', 'real_estate.manage',
        'rides.view', 'rides.manage',
        'settings.view', 'settings.system.update', 'settings.features.manage',
        'analytics.view', 'analytics.export',
        'audit.view', 'audit.export',
        'support.view', 'support.tickets.manage', 'support.assign', 'support.escalate',
        'cms.view', 'cms.publish',
        'finance.view', 'finance.payments.manage', 'finance.refunds.process', 'finance.payouts.manage',
    ];

    /**
     * Default matrix: role => permission prefixes granted (prefix.* grants
     * every action on that module).
     */
    private const MATRIX = [
        'super_admin' => ['*'],
        'administrator' => [
            'products.*', 'orders.view', 'orders.cancel', 'orders.manage',
            'users.view', 'users.update', 'users.suspend',
            'vendors.view', 'healthcare.view', 'learn.view',
            'hotels.view', 'food.view', 'jobs.view', 'real_estate.view', 'rides.view',
            'analytics.view', 'analytics.export', 'audit.view', 'support.view',
            'cms.view', 'cms.publish', 'settings.view', 'finance.view',
        ],
        'vendor_admin' => ['products.create', 'products.update', 'orders.view', 'orders.manage'],
        'moderator' => ['products.view', 'products.approve', 'cms.view', 'support.view'],
        'support_staff' => ['support.view', 'support.tickets.manage', 'support.assign', 'orders.view', 'users.view'],
        'content_manager' => ['cms.view', 'cms.publish', 'learn.view', 'learn.courses.manage'],
        'finance_admin' => ['finance.view', 'finance.payments.manage', 'finance.refunds.process', 'finance.payouts.manage', 'orders.view', 'orders.refund', 'analytics.view', 'audit.view'],
        'healthcare_admin' => ['healthcare.view', 'healthcare.doctors.manage', 'healthcare.appointments.manage', 'healthcare.records.view', 'support.view'],
        'learning_admin' => ['learn.view', 'learn.courses.manage', 'learn.certificates.issue'],
        'customer_service' => ['support.view', 'support.tickets.manage', 'support.assign', 'support.escalate', 'orders.view', 'users.view'],
        'category_admin' => ['products.view', 'products.approve', 'orders.view'],
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
