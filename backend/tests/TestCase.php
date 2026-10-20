<?php

namespace Tests;

use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\DB;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    /**
     * Seed the canonical permission matrix once per test process.
     *
     * Effective-permission resolution reads the role_permissions table. The
     * suite never seeded it, so every non-super_admin role gate resolved
     * against an empty matrix (403 / 302) even when the role holds the grant
     * in the canonical matrix.
     *
     * The seed runs on its own connection, outside the per-test transaction,
     * so the matrix survives every transaction rollback and is available to
     * the whole run - the same way it exists in production.
     */
    protected function seedPermissionMatrixOnce(): void
    {
        static $seeded = false;

        if ($seeded) {
            return;
        }

        $seeded = true;

        $default = DB::getDefaultConnection();
        $connection = $default.'_matrix_seed';

        config(['database.connections.'.$connection => array_merge(
            (array) config('database.connections.'.$default),
            ['name' => $connection]
        )]);

        DB::purge($connection);
        DB::setDefaultConnection($connection);

        try {
            (new PermissionSeeder())->run();
        } finally {
            DB::setDefaultConnection($default);
            DB::purge($connection);
        }
    }

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedPermissionMatrixOnce();
    }

    protected function createUser(array $attributes = []): \App\Models\User
    {
        return \App\Models\User::factory()->create($attributes);
    }

    protected function createAdmin(): \App\Models\User
    {
        $user = $this->createUser();
        $this->assignRole($user, 'super_admin');
        return $user;
    }

    protected function createVendorUser(): \App\Models\User
    {
        $user = $this->createUser();
        $this->assignRole($user, 'user');
        return $user;
    }

    protected function assignRole(\App\Models\User $user, string $role): void
    {
        \App\Models\UserRole::create([
            'user_id' => $user->id,
            'role' => $role,
        ]);
    }

    protected function createVendor(\App\Models\User $user, array $attributes = []): \Modules\Vendors\Entities\Vendor
    {
        return \Modules\Vendors\Entities\Vendor::create(array_merge([
            'user_id' => $user->id,
            'store_name' => fake()->company(),
            'category' => 'general',
            'is_verified' => true,
        ], $attributes));
    }

    protected function actingAsAdmin(): \App\Models\User
    {
        $admin = $this->createAdmin();
        $this->actingAs($admin, 'sanctum');
        return $admin;
    }

    protected function actingAsUser(?string $role = null): \App\Models\User
    {
        $user = $this->createUser();
        if ($role) {
            $this->assignRole($user, $role);
        }
        $this->actingAs($user, 'sanctum');
        return $user;
    }
}
