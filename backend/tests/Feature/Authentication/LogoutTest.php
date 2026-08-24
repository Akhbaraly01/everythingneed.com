<?php

namespace Tests\Feature\Authentication;

use Tests\TestCase;

class LogoutTest extends TestCase
{
    public function test_authenticated_user_can_logout(): void
    {
        $user = $this->createUser();
        $token = $user->createToken('auth-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/auth/logout');

        $response->assertOk()
            ->assertJson([
                'message' => 'Logged out successfully',
            ]);
    }

    public function test_unauthenticated_user_cannot_logout(): void
    {
        $response = $this->postJson('/api/auth/logout');

        $response->assertUnauthorized();
    }

    public function test_logout_deletes_current_token(): void
    {
        $user = $this->createUser();
        $token = $user->createToken('auth-token')->plainTextToken;

        $this->assertDatabaseHas('personal_access_tokens', [
            'tokenable_id' => $user->id,
        ]);

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/auth/logout');

        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $user->id,
        ]);
    }
}
