<?php

namespace Tests\Feature\Users;

use App\Models\User;
use Modules\Users\Entities\Address;
use Tests\TestCase;

class AccountHardeningTest extends TestCase
{
    public function test_account_delete_requires_password(): void
    {
        $user = $this->actingAsUser();

        $this->deleteJson('/api/account')->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);

        $this->assertNotNull($user->fresh());
    }

    public function test_account_delete_wrong_password_rejected(): void
    {
        $user = User::factory()->create(['password' => bcrypt('correct-pass')]);
        $this->actingAs($user, 'sanctum');

        $this->deleteJson('/api/account', ['password' => 'wrong-pass'])->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);

        $this->assertNotNull($user->fresh());
    }

    public function test_account_delete_with_password_revokes_tokens_and_deletes_user(): void
    {
        $user = User::factory()->create(['password' => bcrypt('correct-pass')]);
        $user->createToken('device-a');
        $user->createToken('device-b');
        $this->actingAs($user, 'sanctum');

        $this->deleteJson('/api/account', ['password' => 'correct-pass'])->assertOk()
            ->assertJson(['message' => 'Account deleted successfully']);

        $this->assertNull(User::find($user->id));
        $this->assertEquals(0, \App\Models\User::withTrashed()->find($user->id)?->tokens()->count() ?? 0);
    }

    public function test_unauthenticated_cannot_delete_account(): void
    {
        $this->deleteJson('/api/account', ['password' => 'x'])->assertUnauthorized();
    }

    public function test_first_address_becomes_default_automatically(): void
    {
        $user = $this->actingAsUser();

        $res = $this->postJson('/api/addresses', [
            'line1' => '1 First St',
            'city' => 'Accra',
            'country' => 'GH',
        ]);

        $res->assertStatus(201);
        $this->assertTrue(Address::where('user_id', $user->id)->first()->is_default);
    }

    public function test_second_address_does_not_steal_default(): void
    {
        $user = $this->actingAsUser();

        $this->postJson('/api/addresses', [
            'line1' => '1 First St',
            'city' => 'Accra',
            'country' => 'GH',
        ]);

        $this->postJson('/api/addresses', [
            'line1' => '2 Second St',
            'city' => 'Kumasi',
            'country' => 'GH',
        ]);

        $defaults = Address::where('user_id', $user->id)->where('is_default', true)->get();
        $this->assertCount(1, $defaults);
        $this->assertEquals('1 First St', $defaults->first()->line1);
    }

    public function test_setting_default_moves_flag_exclusively(): void
    {
        $user = $this->actingAsUser();

        $a1 = $user->addresses()->create([
            'line1' => '1 First St', 'city' => 'Accra', 'country' => 'GH', 'is_default' => true,
        ]);
        $a2 = $user->addresses()->create([
            'line1' => '2 Second St', 'city' => 'Kumasi', 'country' => 'GH', 'is_default' => false,
        ]);

        $this->putJson("/api/addresses/{$a2->id}/default")->assertOk();

        $this->assertFalse($a1->fresh()->is_default);
        $this->assertTrue($a2->fresh()->is_default);
        $this->assertEquals(1, Address::where('user_id', $user->id)->where('is_default', true)->count());
    }

    public function test_cannot_touch_another_users_address(): void
    {
        $me = $this->actingAsUser();
        $other = User::factory()->create();
        $theirs = $other->addresses()->create([
            'line1' => '9 Their St', 'city' => 'Lagos', 'country' => 'NG',
        ]);

        $this->putJson("/api/addresses/{$theirs->id}/default")->assertNotFound();
        $this->deleteJson("/api/addresses/{$theirs->id}")->assertNotFound();

        $this->assertNotNull($theirs->fresh());
    }

    public function test_deleting_default_promotes_next_address(): void
    {
        $user = $this->actingAsUser();

        $a1 = $user->addresses()->create([
            'line1' => '1 First St', 'city' => 'Accra', 'country' => 'GH', 'is_default' => true,
        ]);
        $a2 = $user->addresses()->create([
            'line1' => '2 Second St', 'city' => 'Kumasi', 'country' => 'GH', 'is_default' => false,
        ]);

        $this->deleteJson("/api/addresses/{$a1->id}")->assertOk();

        $this->assertTrue($a2->fresh()->is_default);
        $this->assertEquals(1, Address::where('user_id', $user->id)->where('is_default', true)->count());
    }

    public function test_delete_nonexistent_address_is_404(): void
    {
        $this->actingAsUser();

        $this->deleteJson('/api/addresses/00000000-0000-0000-0000-000000000000')->assertNotFound();
    }

    public function test_user_stats_returns_shape(): void
    {
        $this->actingAsUser();

        $this->getJson('/api/user/stats')->assertOk()
            ->assertJsonStructure([
                'orders_count', 'wishlist_count', 'wallet_balance',
                'certificates_count', 'enrolled_courses', 'addresses_count', 'recent_orders',
            ]);
    }

    public function test_profile_cannot_set_email_via_update(): void
    {
        $user = $this->actingAsUser();

        $this->putJson('/api/profile', [
            'full_name' => 'Ok',
            'email' => 'attacker@evil.test',
            'role' => 'super_admin',
        ])->assertOk();

        $this->assertEquals($user->email, $user->fresh()->email);
        $this->assertFalse($user->fresh()->hasRole('super_admin'));
    }

    public function test_password_change_revokes_other_tokens(): void
    {
        $user = User::factory()->create(['password' => bcrypt('old-pass')]);
        $other = $user->createToken('other-device');
        $current = $user->createToken('this-device');

        $res = $this->withHeader('Authorization', "Bearer {$current->plainTextToken}")
            ->postJson('/api/auth/change-password', [
                'current_password' => 'old-pass',
                'password' => 'brand-new-1',
            ]);

        $res->assertOk();
        $this->assertNull($other->accessToken->fresh());
        $this->assertEquals(1, $user->fresh()->tokens()->count());
    }
}
