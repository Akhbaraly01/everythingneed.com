<?php

namespace Tests\Feature\Authentication;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SuspensionTest extends TestCase
{
    use RefreshDatabase;

    public function test_suspended_user_cannot_login_via_api(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt('password'),
            'suspended_at' => now(),
        ]);

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertStatus(403);
    }

    public function test_active_user_is_unaffected(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt('password'),
            'suspended_at' => null,
        ]);

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertStatus(200);
    }

    public function test_suspended_user_cannot_login_via_web(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt('password'),
            'suspended_at' => now(),
        ]);

        // Web login uses WebAuthController which shares the same guard path.
        $this->from('/login')->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertRedirect('/login');

        $this->assertGuest();
    }
}
