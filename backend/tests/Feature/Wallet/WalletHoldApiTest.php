<?php

namespace Tests\Feature\Wallet;

use App\Models\User;
use Core\Services\WalletService;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WalletHoldApiTest extends TestCase
{
    private WalletService $wallet;

    protected function setUp(): void
    {
        parent::setUp();
        $this->wallet = $this->app->make(WalletService::class);
    }

    public function test_available_balance_endpoint(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $this->wallet->topUp($user->id, 100.00, 'REF-SEED');
        $this->wallet->hold($user->id, 25.00, 'HOLD-API');

        $res = $this->getJson('/api/wallet/available');

        $res->assertOk()->assertJson(['data' => ['available' => 75.00]]);
    }

    public function test_place_hold_via_api(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $this->wallet->topUp($user->id, 100.00, 'REF-SEED');

        $res = $this->postJson('/api/wallet/holds', [
            'amount' => 40,
            'reference' => 'HOLD-HTTP-1',
            'reason' => 'checkout',
        ]);

        $res->assertCreated()
            ->assertJsonPath('data.status', 'active')
            ->assertJsonPath('data.reference', 'HOLD-HTTP-1');
    }

    public function test_place_hold_rejects_insufficient_available(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $this->wallet->topUp($user->id, 10.00, 'REF-SEED');

        $res = $this->postJson('/api/wallet/holds', [
            'amount' => 50,
            'reference' => 'HOLD-HTTP-2',
        ]);

        $res->assertStatus(422);
    }

    public function test_release_hold_via_api(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $this->wallet->topUp($user->id, 100.00, 'REF-SEED');
        $this->wallet->hold($user->id, 30.00, 'HOLD-REL-HTTP');

        $res = $this->postJson('/api/wallet/holds/release', [
            'reference' => 'HOLD-REL-HTTP',
        ]);

        $res->assertOk()->assertJsonPath('data.status', 'released');
        $this->assertEquals(100.00, $this->wallet->getAvailableBalance($user->id));
    }

    public function test_capture_hold_via_api(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $this->wallet->topUp($user->id, 100.00, 'REF-SEED');
        $this->wallet->hold($user->id, 30.00, 'HOLD-CAP-HTTP');

        $res = $this->postJson('/api/wallet/holds/capture', [
            'reference' => 'HOLD-CAP-HTTP',
        ]);

        $res->assertOk()->assertJsonPath('data.hold.status', 'captured');
        $this->assertEquals(70.00, $this->wallet->getBalance($user->id));
    }

    public function test_list_holds_endpoint(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $this->wallet->topUp($user->id, 200.00, 'REF-SEED');
        $this->wallet->hold($user->id, 10.00, 'HOLD-L1');
        $this->wallet->hold($user->id, 20.00, 'HOLD-L2');

        $res = $this->getJson('/api/wallet/holds');

        $res->assertOk()->assertJsonPath('meta.total', 2);
    }

    public function test_guest_cannot_place_hold(): void
    {
        $res = $this->postJson('/api/wallet/holds', [
            'amount' => 10,
            'reference' => 'HOLD-GUEST',
        ]);

        $res->assertUnauthorized();
    }
}
