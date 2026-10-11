<?php

namespace Tests\Feature\Payments;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Modules\Products\Entities\Product;
use Modules\Vendors\Entities\Vendor;
use Tests\TestCase;

/**
 * W9 (Y-01): money invariants.
 *
 * Pins: transfers conserve value and never 500 (self/insufficient map to
 * 422), withdrawals can never drive a balance negative, hold release/
 * capture accounting stays consistent under double actions, transfer
 * idempotency, and client-supplied totals are ignored (server computes).
 */
class MoneyInvariantsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['payments.driver' => 'mock']);
    }

    private function verifyUser(User $user): void
    {
        DB::table('kyc_verifications')->insert([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => $user->id,
            'status' => 'approved',
            'document_type' => 'passport',
            'document_number' => 'INV001',
            'verified_at' => now(),
            'submitted_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function balance(User $user): float
    {
        return (float) app(\Core\Services\Contracts\WalletServiceInterface::class)->getBalance($user->id);
    }

    private function available(User $user): float
    {
        return (float) app(\Core\Services\Contracts\WalletServiceInterface::class)->getAvailableBalance($user->id);
    }

    public function test_transfer_conserves_value_and_edges_answer_422(): void
    {
        $sender = $this->createUser();
        $receiver = $this->createUser();
        $this->verifyUser($sender);
        $this->verifyUser($receiver);

        $core = app(\Core\Services\Contracts\WalletServiceInterface::class);
        $core->topUp($sender->id, 100, 'SEED-Y1');

        $this->actingAs($sender, 'sanctum')
            ->postJson('/api/wallet/transfer', ['to_user_id' => $receiver->id, 'amount' => 40])
            ->assertStatus(201);

        $this->assertEquals(60.0, $this->balance($sender));
        $this->assertEquals(40.0, $this->balance($receiver));
        $this->assertEquals(100.0, $this->balance($sender) + $this->balance($receiver), 'Transfer must conserve value');

        // Self-transfer is a domain validation error, not a 500.
        $this->actingAs($sender, 'sanctum')
            ->postJson('/api/wallet/transfer', ['to_user_id' => $sender->id, 'amount' => 10])
            ->assertStatus(422);

        // Over-balance transfer rejected; nothing moves.
        $this->actingAs($sender, 'sanctum')
            ->postJson('/api/wallet/transfer', ['to_user_id' => $receiver->id, 'amount' => 1000])
            ->assertStatus(422);
        $this->assertEquals(60.0, $this->balance($sender));
        $this->assertEquals(40.0, $this->balance($receiver));

        // Negative/zero amounts never reach the ledger.
        $this->actingAs($sender, 'sanctum')
            ->postJson('/api/wallet/transfer', ['to_user_id' => $receiver->id, 'amount' => -5])
            ->assertStatus(422);
        $this->assertEquals(60.0, $this->balance($sender));
    }

    public function test_transfer_is_idempotent_for_the_same_key(): void
    {
        $sender = $this->createUser();
        $receiver = $this->createUser();
        $this->verifyUser($sender);
        $this->verifyUser($receiver);
        app(\Core\Services\Contracts\WalletServiceInterface::class)->topUp($sender->id, 100, 'SEED-Y1B');

        $payload = ['to_user_id' => $receiver->id, 'amount' => 25, 'idempotency_key' => 'trf-inv-1'];
        $this->actingAs($sender, 'sanctum')->postJson('/api/wallet/transfer', $payload)->assertStatus(201);
        $this->actingAs($sender, 'sanctum')->postJson('/api/wallet/transfer', $payload)->assertStatus(201);

        $this->assertEquals(75.0, $this->balance($sender));
        $this->assertEquals(25.0, $this->balance($receiver));
    }

    public function test_withdrawals_can_never_drive_a_balance_negative(): void
    {
        $user = $this->createUser();
        $this->verifyUser($user);
        app(\Core\Services\Contracts\WalletServiceInterface::class)->topUp($user->id, 50, 'SEED-Y2');

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/wallet/withdraw', ['amount' => 30])
            ->assertOk();
        $this->assertEquals(20.0, $this->balance($user));

        // Overdraft rejected as a domain error and balance untouched.
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/wallet/withdraw', ['amount' => 100])
            ->assertStatus(422);
        $this->assertEquals(20.0, $this->balance($user));

        // Drain to zero, then one more cent must fail - never negative.
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/wallet/withdraw', ['amount' => 20])
            ->assertOk();
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/wallet/withdraw', ['amount' => 1])
            ->assertStatus(422);

        $this->assertEquals(0.0, $this->balance($user));
        $this->assertGreaterThanOrEqual(0.0, $this->balance($user));
    }

    public function test_hold_release_and_capture_stay_consistent_under_double_actions(): void
    {
        $user = $this->createUser();
        app(\Core\Services\Contracts\WalletServiceInterface::class)->topUp($user->id, 100, 'SEED-Y3');

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/wallet/holds', ['amount' => 30, 'reference' => 'HOLD-INV-1'])
            ->assertStatus(201);
        $this->assertEquals(70.0, $this->available($user), 'Active hold reduces available funds');
        $this->assertEquals(100.0, $this->balance($user), 'Hold never mutates balance');

        // Double release: second answer is a 422, funds stay correct.
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/wallet/holds/release', ['reference' => 'HOLD-INV-1'])
            ->assertOk();
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/wallet/holds/release', ['reference' => 'HOLD-INV-1'])
            ->assertStatus(422);
        $this->assertEquals(100.0, $this->available($user));

        // Capture actually debits; double capture cannot debit twice.
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/wallet/holds', ['amount' => 40, 'reference' => 'HOLD-INV-2'])
            ->assertStatus(201);
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/wallet/holds/capture', ['reference' => 'HOLD-INV-2'])
            ->assertOk();
        $this->assertEquals(60.0, $this->balance($user));

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/wallet/holds/capture', ['reference' => 'HOLD-INV-2'])
            ->assertStatus(422);
        $this->assertEquals(60.0, $this->balance($user), 'Double capture must never double-debit');
        $this->assertEquals(60.0, $this->available($user));
    }

    public function test_client_supplied_totals_are_ignored_by_checkout(): void
    {
        $vendorUser = $this->createVendorUser();
        $vendor = Vendor::create([
            'user_id' => $vendorUser->id,
            'store_name' => 'Invariant Store',
            'category' => 'electronics',
            'is_verified' => true,
        ]);
        $product = Product::create([
            'vendor_id' => $vendor->id,
            'name' => 'Invariant Widget',
            'description' => 'Server-priced',
            'category' => 'electronics',
            'price' => 25.0,
            'stock_quantity' => 10,
            'is_active' => true,
            'approved_at' => now(),
        ]);

        $customer = $this->createUser();
        $this->actingAs($customer, 'sanctum');

        $response = $this->postJson('/api/product-orders', [
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
            'shipping_address' => '1 Invariant Way',
            'shipping_city' => 'Accra',
            // Hostile client totals - server must ignore all of them.
            'total_amount' => 0.01,
            'subtotal' => 0.01,
            'discount' => 99.99,
        ]);
        $response->assertStatus(201);

        $order = \Modules\Orders\Entities\Order::find($response->json('data.id'));
        $this->assertEquals(50.0, (float) $order->total_amount, 'Server computes the total');
        $this->assertEquals(50.0, (float) $order->subtotal);
        $this->assertEquals(0.0, (float) $order->discount);
    }
}
