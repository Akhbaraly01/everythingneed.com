<?php

namespace Tests\Feature\Authentication;

use Tests\TestCase;
use App\Models\User;

class RegistrationTest extends TestCase
{
    private array $validData = [
        'email' => 'test@example.com',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'full_name' => 'Test User',
    ];

    public function test_user_can_register_with_valid_data(): void
    {
        $response = $this->postJson('/api/auth/register', $this->validData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'user' => ['id', 'email', 'name', 'role'],
                    'access_token',
                ],
            ])
            ->assertJson([
                'message' => 'Registration successful',
                'data' => [
                    'user' => [
                        'email' => 'test@example.com',
                        'name' => 'Test User',
                        'role' => 'user',
                    ],
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'test@example.com',
            'name' => 'Test User',
        ]);
    }

    public function test_registration_requires_email(): void
    {
        $data = $this->validData;
        unset($data['email']);

        $response = $this->postJson('/api/auth/register', $data);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_registration_requires_password(): void
    {
        $data = $this->validData;
        unset($data['password']);
        unset($data['password_confirmation']);

        $response = $this->postJson('/api/auth/register', $data);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);
    }

    public function test_registration_rejects_duplicate_email(): void
    {
        $this->createUser(['email' => 'existing@example.com']);

        $data = $this->validData;
        $data['email'] = 'existing@example.com';

        $response = $this->postJson('/api/auth/register', $data);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_registration_validates_email_format(): void
    {
        $data = $this->validData;
        $data['email'] = 'not-an-email';

        $response = $this->postJson('/api/auth/register', $data);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_registration_validates_password_minimum_length(): void
    {
        $data = $this->validData;
        $data['password'] = 'short';
        $data['password_confirmation'] = 'short';

        $response = $this->postJson('/api/auth/register', $data);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);
    }

    public function test_registration_validates_password_confirmation(): void
    {
        $data = $this->validData;
        $data['password_confirmation'] = 'different-password';

        $response = $this->postJson('/api/auth/register', $data);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);
    }

    public function test_registration_creates_user_profile(): void
    {
        $response = $this->postJson('/api/auth/register', $this->validData);

        $response->assertStatus(201);

        $user = User::where('email', 'test@example.com')->first();
        $this->assertNotNull($user->profile);
        $this->assertEquals('Test User', $user->profile->full_name);
    }

    public function test_registration_returns_sanctum_token(): void
    {
        $response = $this->postJson('/api/auth/register', $this->validData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'access_token',
                ],
            ]);

        $this->assertNotEmpty($response->json('data.access_token'));
    }

    public function test_registration_works_without_full_name(): void
    {
        $data = [
            'email' => 'noname@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ];

        $response = $this->postJson('/api/auth/register', $data);

        $response->assertStatus(201);

        $user = User::where('email', 'noname@example.com')->first();
        $this->assertNotNull($user);
        $this->assertEquals('noname@example.com', $user->name);
    }
}
