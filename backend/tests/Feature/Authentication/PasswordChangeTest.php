<?php

namespace Tests\Feature\Authentication;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PasswordChangeTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_change_password_with_correct_current(): void
    {
        $user = User::factory()->create(['password' => bcrypt('current-pass')]);
        // A second device token that must be revoked
        $other = $user->createToken('other-device');
        // Real bearer token for THIS device (so its DB id exists)
        $current = $user->createToken('this-device');

        $res = $this->withHeader('Authorization', "Bearer {$current->plainTextToken}")
            ->postJson('/api/auth/change-password', [
                'current_password' => 'current-pass',
                'password' => 'totally-new-1',
            ]);

        $res->assertStatus(200);
        $this->assertTrue(Hash::check('totally-new-1', $user->fresh()->password));
        // Current session token kept, other devices revoked
        $this->assertEquals(1, $user->fresh()->tokens()->count());
        $this->assertNull($other->accessToken->fresh());
    }

    public function test_wrong_current_password_is_rejected(): void
    {
        $user = User::factory()->create(['password' => bcrypt('right-pass')]);

        $res = $this->actingAs($user, 'sanctum')->postJson('/api/auth/change-password', [
            'current_password' => 'wrong-pass',
            'password' => 'totally-new-1',
        ]);

        $res->assertStatus(422);
        $this->assertTrue(Hash::check('right-pass', $user->fresh()->password));
    }

    public function test_new_password_must_differ_from_current(): void
    {
        $user = User::factory()->create(['password' => bcrypt('same-pass')]);

        $this->actingAs($user, 'sanctum')->postJson('/api/auth/change-password', [
            'current_password' => 'same-pass',
            'password' => 'same-pass',
        ])->assertStatus(422);
    }
}
