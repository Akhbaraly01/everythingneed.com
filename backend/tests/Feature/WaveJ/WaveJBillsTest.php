<?php

namespace Tests\Feature\WaveJ;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Modules\Bills\Entities\BillPurchase;
use Tests\TestCase;

class WaveJBillsTest extends TestCase
{
    use RefreshDatabase;

    private function verifyUser(User $user): void
    {
        DB::table('kyc_verifications')->insert([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => $user->id,
            'status' => 'approved',
            'verified_at' => now(),
            'submitted_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function fund(User $user, float $amount = 500, string $suffix = 'J'): void
    {
        app(\Core\Services\Contracts\WalletServiceInterface::class)
            ->topUp($user->id, $amount, "SEED-J-{$suffix}-".$user->id);
    }

    private function airtimePayload(array $overrides = []): array
    {
        return array_merge([
            'service' => 'airtime',
            'country' => 'NG',
            'currency' => 'NGN',
            'amount' => 100,
            'account_fields' => [
                'phone' => '+2348012345678',
                'network' => 'mtn',
            ],
            'idempotency_key' => 'wavej-'.uniqid(),
        ], $overrides);
    }

    public function test_services_catalog_lists_all_five_services_with_availability(): void
    {
        $user = $this->createUser();

        $this->getJson('/api/bills/services')->assertStatus(401);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/bills/services?country=NG&currency=NGN')
            ->assertOk();

        $services = collect($response->json('data'));
        foreach (['airtime', 'data', 'electricity', 'internet', 'tv'] as $id) {
            $service = $services->firstWhere('id', $id);
            $this->assertNotNull($service, "service {$id} listed");
            $this->assertTrue($service['available'], "service {$id} available for NG/NGN");
            $this->assertNotEmpty($service['fields']);
        }

        // Unsupported country is reported honestly, not hidden.
        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/bills/services?country=US&currency=USD')
            ->assertOk();
        $electricity = collect($response->json('data'))->firstWhere('id', 'electricity');
        $this->assertFalse($electricity['available']);
        $this->assertNotEmpty($electricity['unavailable_reasons']);
    }

    public function test_airtime_purchase_debits_wallet_and_records_provider_reference(): void
    {
        config(['bills.driver' => 'mock']);
        $user = $this->createUser();
        $this->verifyUser($user);
        $this->fund($user);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/bills/purchase', $this->airtimePayload())
            ->assertStatus(201);

        $response->assertJsonPath('data.status', 'succeeded')
            ->assertJsonPath('data.service', 'airtime')
            ->assertJsonPath('data.country', 'NG');

        // Account identifiers are masked on the wire.
        $masked = $response->json('data.account_masked');
        $this->assertSame('****5678', $masked['phone']);
        $this->assertArrayNotHasKey('account_fields', $response->json('data'));

        $purchase = BillPurchase::findOrFail($response->json('data.id'));
        $this->assertNotNull($purchase->provider_reference);
        $this->assertStringStartsWith('BILL-', $purchase->reference);

        $core = app(\Core\Services\Contracts\WalletServiceInterface::class);
        $this->assertEqualsWithDelta(400.0, $core->getBalance($user->id), 0.01);
        $this->assertDatabaseHas('wallet_transactions', [
            'reference' => 'BILL-PAY-'.$purchase->id,
            'type' => 'debit',
        ]);

        // The money movement leaves a payment row with the bill purpose.
        $this->assertDatabaseHas('payments', [
            'purpose' => 'bill_payment',
            'method' => 'wallet',
            'status' => 'succeeded',
        ]);
    }

    public function test_purchase_is_idempotent_for_the_same_key(): void
    {
        config(['bills.driver' => 'mock']);
        $user = $this->createUser();
        $this->verifyUser($user);
        $this->fund($user);

        $payload = $this->airtimePayload(['idempotency_key' => 'wavej-replay-1']);

        $first = $this->actingAs($user, 'sanctum')
            ->postJson('/api/bills/purchase', $payload)
            ->assertStatus(201);

        $second = $this->actingAs($user, 'sanctum')
            ->postJson('/api/bills/purchase', $payload)
            ->assertStatus(201);

        $this->assertSame($first->json('data.id'), $second->json('data.id'));
        $this->assertSame(1, BillPurchase::where('idempotency_key', 'wavej-replay-1')->count());

        $core = app(\Core\Services\Contracts\WalletServiceInterface::class);
        $this->assertEqualsWithDelta(400.0, $core->getBalance($user->id), 0.01);
    }

    public function test_purchase_requires_verified_kyc_and_funds(): void
    {
        config(['bills.driver' => 'mock']);

        // Unverified, even funded: 403.
        $holder = $this->createUser();
        $this->fund($holder);
        $this->actingAs($holder, 'sanctum')
            ->postJson('/api/bills/purchase', $this->airtimePayload())
            ->assertStatus(403);

        // Verified but unfunded: honest 422, nothing written as succeeded.
        $broke = $this->createUser();
        $this->verifyUser($broke);
        $this->actingAs($broke, 'sanctum')
            ->postJson('/api/bills/purchase', $this->airtimePayload())
            ->assertStatus(422);
        $this->assertSame(
            'failed',
            BillPurchase::where('user_id', $broke->id)->value('status')
        );
    }

    public function test_purchase_validates_service_country_fields(): void
    {
        config(['bills.driver' => 'mock']);
        $user = $this->createUser();
        $this->verifyUser($user);
        $this->fund($user);

        // Unknown service.
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/bills/purchase', $this->airtimePayload(['service' => 'spaceship']))
            ->assertStatus(422);

        // Unsupported country for electricity.
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/bills/purchase', [
                'service' => 'electricity',
                'country' => 'US',
                'currency' => 'USD',
                'amount' => 50,
                'account_fields' => ['meter_number' => '1234567890', 'disco' => 'ikeja', 'meter_type' => 'prepaid'],
            ])->assertStatus(422);

        // Missing required field.
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/bills/purchase', $this->airtimePayload([
                'account_fields' => ['network' => 'mtn'],
            ]))->assertStatus(422);

        // Malformed phone.
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/bills/purchase', $this->airtimePayload([
                'account_fields' => ['phone' => 'not-a-phone', 'network' => 'mtn'],
            ]))->assertStatus(422);

        $this->assertSame(0, BillPurchase::where('user_id', $user->id)->where('status', 'succeeded')->count());
    }

    public function test_unconfigured_provider_fails_safely_without_fake_success(): void
    {
        config(['bills.driver' => 'definitely_not_a_biller']);
        $user = $this->createUser();
        $this->verifyUser($user);
        $this->fund($user);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/bills/purchase', $this->airtimePayload())
            ->assertStatus(422);

        // Nothing debited, nothing marked succeeded.
        $core = app(\Core\Services\Contracts\WalletServiceInterface::class);
        $this->assertEqualsWithDelta(500.0, $core->getBalance($user->id), 0.01);
        $this->assertSame(0, BillPurchase::where('user_id', $user->id)->where('status', 'succeeded')->count());
    }

    public function test_failed_vend_reverses_the_wallet_debit(): void
    {
        config(['bills.driver' => 'mock', 'bills.mock_fail' => true]);
        $user = $this->createUser();
        $this->verifyUser($user);
        $this->fund($user);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/bills/purchase', $this->airtimePayload())
            ->assertStatus(422);

        $purchase = BillPurchase::where('user_id', $user->id)->firstOrFail();
        $this->assertSame('failed', $purchase->status);
        $this->assertTrue((bool) $purchase->wallet_refunded);

        // The debit came back: balance whole again.
        $core = app(\Core\Services\Contracts\WalletServiceInterface::class);
        $this->assertEqualsWithDelta(500.0, $core->getBalance($user->id), 0.01);
        $this->assertDatabaseHas('wallet_transactions', [
            'reference' => 'WALLET-REF-BILL-'.$purchase->id,
            'type' => 'credit',
        ]);
    }

    public function test_manual_provider_leaves_purchase_pending_without_moving_money(): void
    {
        config(['bills.driver' => 'manual']);
        $user = $this->createUser();
        $this->verifyUser($user);
        $this->fund($user);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/bills/purchase', $this->airtimePayload())
            ->assertStatus(201)
            ->assertJsonPath('data.status', 'pending');

        $core = app(\Core\Services\Contracts\WalletServiceInterface::class);
        $this->assertEqualsWithDelta(500.0, $core->getBalance($user->id), 0.01);
    }

    public function test_purchase_history_is_owner_scoped(): void
    {
        config(['bills.driver' => 'mock']);
        $user = $this->createUser();
        $stranger = $this->createUser();
        $this->verifyUser($user);
        $this->fund($user);

        $created = $this->actingAs($user, 'sanctum')
            ->postJson('/api/bills/purchase', $this->airtimePayload())
            ->assertStatus(201);
        $id = $created->json('data.id');

        $this->actingAs($user, 'sanctum')->getJson('/api/bills/purchases')
            ->assertOk()
            ->assertJsonPath('meta.total', 1);

        $this->actingAs($user, 'sanctum')->getJson("/api/bills/purchases/{$id}")
            ->assertOk()
            ->assertJsonPath('data.id', $id);

        $this->actingAs($stranger, 'sanctum')->getJson("/api/bills/purchases/{$id}")
            ->assertStatus(404);
        $this->actingAs($stranger, 'sanctum')->getJson('/api/bills/purchases')
            ->assertOk()
            ->assertJsonPath('meta.total', 0);
    }

    public function test_bills_endpoints_require_authentication(): void
    {
        $this->getJson('/api/bills/services')->assertStatus(401);
        $this->getJson('/api/bills/purchases')->assertStatus(401);
        $this->postJson('/api/bills/purchase', $this->airtimePayload())->assertStatus(401);
    }
}
