<?php

namespace Tests;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
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
