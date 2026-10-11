<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Safe production seed path: RBAC matrix + feature flags only.
 * Never creates known-credential admin accounts.
 *
 * Usage: php artisan db:seed --class=ProductionSeeder
 */
class ProductionSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            PermissionSeeder::class,
            FeatureFlagSeeder::class,
        ]);
    }
}
