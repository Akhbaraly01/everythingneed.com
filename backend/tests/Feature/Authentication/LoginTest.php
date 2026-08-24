<?php

namespace Tests\Feature\Authentication;

use Tests\TestCase;
use App\Models\User;

class LoginTest extends TestCase
{
    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = $this->createUser([
            'email' => 'login@example.com',
            'password' => bcrypt('Password123!'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'login@example.com',
            'password' => 'Password123!',
        ]);

        $response->assertOk()
            ->assertJsonStructure([
                'message',
                'data' => [
                    'user' => ['id', 'email', 'name', 'role'],
                    'access_token',
                ],
            ])
            ->assertJson([
                'message' => 'Login successful',
                'data' => [
                    'user' => [
                        'email' => 'login@example.com',
                    ],
                ],
            ]);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        $this->createUser([
            'email' => 'login@example.com',
            'password' => bcrypt('Password123!'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'login@example.com',
            'password' => 'WrongPassword',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Invalid credentials',
            ]);
    }

    public function test_login_fails_with_non_existent_email(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'nonexistent@example.com',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Invalid credentials',
            ]);
    }

    public function test_login_returns_sanctum_token(): void
    {
        $user = $this->createUser([
            'email' => 'token@example.com',
            'password' => bcrypt('Password123!'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'token@example.com',
            'password' => 'Password123!',
        ]);

        $response->assertOk();

        $token = $response->json('data.access_token');
        $this->assertNotEmpty($token);
        $this->assertDatabaseHas('personal_access_tokens', [
            'tokenable_id' => $user->id,
        ]);
    }

    public function test_login_requires_email(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'password' => 'Password123!',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_login_requires_password(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'test@example.com',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);
    }

    public function test_login_validates_email_format(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'not-an-email',
            'password' => 'Password123!',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }
}
