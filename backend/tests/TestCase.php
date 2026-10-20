<?php

namespace Tests;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Cache;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
    }

    /**
     * The effective-permission resolver memoises the role matrix for 300
     * seconds. A test that seeds the matrix must not leak it into the next
     * test: the rows themselves roll back with the transaction, but the
     * memoised copy would survive. Flushing it per test keeps the "deny by
     * default" baseline the permission-enforcement tests assert, while a
     * test that seeds the matrix still sees it.
     */
    protected function tearDown(): void
    {
        Cache::forget('rbac.matrix');

        parent::tearDown();
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
