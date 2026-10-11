<?php

namespace Tests\Feature\Bills;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Wave T — Bills module (spec 30) had no dedicated suite: catalog,
 * validation, KYC gate, wallet debit, idempotent replay, provider-failure
 * reversal, and ownership scoping.
 */
class BillsPurchaseTest extends TestCase
{
    private function verifyKyc(object $user): void
    {
        DB::table('kyc_verifications')->insert([
            'id' => (string) Str::uuid(),
            'user_id' => $user->id,
            'status' => 'approved',
            'attempts' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function fund(object $user, float $amount): void
    {
        $this->actingAs($user, 'sanctum');
        $this->postJson('/api/wallet/deposit', [
            'amount' => $amount,
            'payment_method' => 'card',
        ])->assertStatus(200);
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'service' => 'airtime',
            'country' => 'NG',
            'currency' => 'NGN',
            'amount' => 100,
            'account_fields' => ['phone' => '+2348012345678', 'network' => 'MTN'],
        ], $overrides);
    }

    private function balance(object $user): float
    {
        return (float) DB::table('wallets')->where('user_id', $user->id)->value('balance');
    }

    public function test_services_catalog_lists_airtime_for_ng(): void
    {
        $user = $this->createUser();
        $this->actingAs($user, 'sanctum');

        $res = $this->getJson('/api/bills/services?country=NG&currency=NGN')->assertOk();
        $airtime = collect($res->json('data'))->firstWhere('id', 'airtime');

        $this->assertNotNull($airtime);
        $this->assertTrue($airtime['available']);
        $this->assertContains('phone', $airtime['fields']);
    }

    public function test_guest_cannot_touch_bills(): void
    {
        $this->getJson('/api/bills/services')->assertStatus(401);
        $this->postJson('/api/bills/purchase', $this->payload())->assertStatus(401);
    }

    public function test_purchase_unknown_service_is_rejected(): void
    {
        $user = $this->createUser();
        $this->verifyKyc($user);
        $this->actingAs($user, 'sanctum');

        $this->postJson('/api/bills/purchase', $this->payload(['service' => 'nope']))
            ->assertStatus(422);
    }

    public function test_purchase_requires_verified_identity(): void
    {
        $user = $this->createUser();
        $this->fund($user, 500);
        $this->actingAs($user, 'sanctum');

        // No KYC row: the money path refuses before any debit.
        $this->postJson('/api/bills/purchase', $this->payload())->assertStatus(403);
        $this->assertSame(500.0, $this->balance($user));
    }

    public function test_purchase_requires_account_fields(): void
    {
        $user = $this->createUser();
        $this->verifyKyc($user);
        $this->actingAs($user, 'sanctum');

        $this->postJson('/api/bills/purchase', $this->payload([
            'account_fields' => ['network' => 'MTN'],
        ]))->assertStatus(422);
    }

    public function test_full_purchase_debits_wallet_and_succeeds(): void
    {
        $user = $this->createUser();
        $this->verifyKyc($user);
        $this->fund($user, 500);
        $this->actingAs($user, 'sanctum');

        $id = $this->postJson('/api/bills/purchase', $this->payload())
            ->assertStatus(201)
            ->json('data.id');
        $this->assertNotEmpty($id);

        $this->assertSame('succeeded', DB::table('bill_purchases')->where('id', $id)->value('status'));
        $this->assertSame(400.0, $this->balance($user));

        // Ownership-scoped reads: mine visible, stranger gets 404.
        $this->getJson('/api/bills/purchases/' . $id)->assertOk();
        $this->getJson('/api/bills/purchases')->assertOk();
        $this->assertSame($id, $this->getJson('/api/bills/purchases')->json('data.0.id'));

        $stranger = $this->createUser();
        $this->actingAs($stranger, 'sanctum');
        $this->getJson('/api/bills/purchases/' . $id)->assertStatus(404);
        $this->assertSame([], $this->getJson('/api/bills/purchases')->json('data'));
    }

    public function test_idempotent_replay_returns_the_original_purchase(): void
    {
        $user = $this->createUser();
        $this->verifyKyc($user);
        $this->fund($user, 500);
        $this->actingAs($user, 'sanctum');

        $key = 'wavet-bill-' . Str::random(10);
        $first = $this->postJson('/api/bills/purchase', $this->payload(['idempotency_key' => $key]))
            ->assertStatus(201)
            ->json('data.id');
        $second = $this->postJson('/api/bills/purchase', $this->payload(['idempotency_key' => $key]))
            ->assertStatus(201)
            ->json('data.id');

        $this->assertSame($first, $second);
        $this->assertSame(1, DB::table('bill_purchases')->where('idempotency_key', $key)->count());
        // Debited exactly once.
        $this->assertSame(400.0, $this->balance($user));
    }

    public function test_provider_failure_reverses_the_debit(): void
    {
        config(['bills.mock_fail' => true]);

        $user = $this->createUser();
        $this->verifyKyc($user);
        $this->fund($user, 500);
        $this->actingAs($user, 'sanctum');

        $this->postJson('/api/bills/purchase', $this->payload())->assertStatus(422);

        $purchase = DB::table('bill_purchases')->where('user_id', $user->id)->first();
        $this->assertNotNull($purchase);
        $this->assertSame('failed', $purchase->status);
        $this->assertSame(500.0, $this->balance($user));
    }
}
