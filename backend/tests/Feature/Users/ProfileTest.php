<?php

namespace Tests\Feature\Users;

use Tests\TestCase;
use App\Models\User;

class ProfileTest extends TestCase
{
    public function test_authenticated_user_can_view_profile(): void
    {
        $user = $this->actingAsUser();

        $response = $this->getJson('/api/auth/me');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'user' => ['id', 'email', 'name', 'role'],
                ],
            ])
            ->assertJson([
                'data' => [
                    'user' => [
                        'email' => $user->email,
                    ],
                ],
            ]);
    }

    public function test_unauthenticated_user_cannot_view_profile(): void
    {
        $response = $this->getJson('/api/auth/me');

        $response->assertUnauthorized();
    }

    public function test_authenticated_user_can_update_profile(): void
    {
        $user = $this->actingAsUser();

        $response = $this->putJson('/api/profile', [
            'full_name' => 'Updated Name',
            'phone' => '+1234567890',
        ]);

        $response->assertOk()
            ->assertJson([
                'message' => 'Profile updated successfully',
            ]);

        $this->assertDatabaseHas('profiles', [
            'user_id' => $user->id,
            'full_name' => 'Updated Name',
            'phone' => '+1234567890',
        ]);
    }

    public function test_unauthenticated_user_cannot_update_profile(): void
    {
        $response = $this->putJson('/api/profile', [
            'full_name' => 'Hacker',
        ]);

        $response->assertUnauthorized();
    }

    public function test_user_can_add_address(): void
    {
        $user = $this->actingAsUser();

        $response = $this->postJson('/api/addresses', [
            'line1' => '123 Main Street',
            'city' => 'New York',
            'country' => 'US',
            'region' => 'NY',
            'postal_code' => '10001',
            'is_default' => true,
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'message' => 'Address added successfully',
            ]);

        $this->assertDatabaseHas('addresses', [
            'user_id' => $user->id,
            'line1' => '123 Main Street',
            'city' => 'New York',
            'country' => 'US',
            'is_default' => true,
        ]);
    }

    public function test_user_address_requires_line1(): void
    {
        $this->actingAsUser();

        $response = $this->postJson('/api/addresses', [
            'city' => 'New York',
            'country' => 'US',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['line1']);
    }

    public function test_user_address_requires_city(): void
    {
        $this->actingAsUser();

        $response = $this->postJson('/api/addresses', [
            'line1' => '123 Main Street',
            'country' => 'US',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['city']);
    }

    public function test_user_address_requires_country(): void
    {
        $this->actingAsUser();

        $response = $this->postJson('/api/addresses', [
            'line1' => '123 Main Street',
            'city' => 'New York',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['country']);
    }

    public function test_user_can_list_addresses(): void
    {
        $user = $this->actingAsUser();

        $user->addresses()->create([
            'line1' => '123 Main Street',
            'city' => 'New York',
            'country' => 'US',
        ]);

        $user->addresses()->create([
            'line1' => '456 Oak Avenue',
            'city' => 'Los Angeles',
            'country' => 'US',
        ]);

        $this->assertEquals(2, $user->addresses()->count());
        $this->assertDatabaseHas('addresses', [
            'user_id' => $user->id,
            'line1' => '123 Main Street',
        ]);
        $this->assertDatabaseHas('addresses', [
            'user_id' => $user->id,
            'line1' => '456 Oak Avenue',
        ]);
    }
}
