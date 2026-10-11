<?php

namespace Tests\Feature\Payments;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class FinancialHardeningTest extends TestCase
{
    use RefreshDatabase;

    public function test_charge_is_idempotent_for_same_key(): void
    {
        config(['payments.driver' => 'mock']);
        $user = $this->createUser();

        $gateway = app(\Core\Services\Contracts\PaymentGatewayInterface::class);

        $first = $gateway->charge([
            'user_id' => $user->id,
            'amount' => 40,
            'currency' => 'USD',
            'method' => 'card',
            'reference' => 'IDEM-1',
            'idempotency_key' => 'key-abc-123',
        ]);

        $second = $gateway->charge([
            'user_id' => $user->id,
            'amount' => 40,
            'currency' => 'USD',
            'method' => 'card',
            'reference' => 'IDEM-2-should-not-matter',
            'idempotency_key' => 'key-abc-123',
        ]);

        $this->assertTrue($first['success']);
        $this->assertTrue($second['success']);
        $this->assertTrue($second['idempotent'] ?? false);
        $this->assertSame($first['payment_id'], $second['payment_id']);
        $this->assertSame(1, \Modules\Payments\Entities\Payment::where('user_id', $user->id)->count());
    }

    public function test_wallet_deposit_is_idempotent(): void
    {
        config(['payments.driver' => 'mock']);
        $user = $this->createUser();
        $service = app(\Modules\Wallet\Services\WalletService::class);

        $tx1 = $service->deposit($user->id, 75, 'card', 'dep-key-1');
        $tx2 = $service->deposit($user->id, 75, 'card', 'dep-key-1');

        $this->assertSame($tx1->id, $tx2->id);
        $this->assertEquals(75.0, (float) app(\Core\Services\Contracts\WalletServiceInterface::class)->getBalance($user->id));
    }

    public function test_wallet_withdraw_is_idempotent_for_same_key(): void
    {
        $user = $this->createUser();
        $core = app(\Core\Services\Contracts\WalletServiceInterface::class);
        $core->topUp($user->id, 200, 'SEED-WALLET');

        $service = app(\Modules\Wallet\Services\WalletService::class);
        $tx1 = $service->withdraw($user->id, 50, 'wd-key-1');
        $tx2 = $service->withdraw($user->id, 50, 'wd-key-1');

        $this->assertSame($tx1->id, $tx2->id);
        $this->assertEquals(150.0, $core->getBalance($user->id));
    }

    public function test_stripe_webhook_marks_payment_succeeded_once(): void
    {
        $user = $this->createUser();
        $payment = \Modules\Payments\Entities\Payment::create([
            'user_id' => $user->id,
            'amount' => 10,
            'currency' => 'USD',
            'status' => 'processing',
            'method' => 'card',
            'reference' => 'PAY-WH-1',
            'provider' => 'stripe',
            'provider_payment_id' => 'pi_test_123',
        ]);

        $payload = [
            'id' => 'evt_1',
            'type' => 'payment_intent.succeeded',
            'data' => ['object' => ['id' => 'pi_test_123']],
        ];

        $this->postJson('/api/webhooks/payments/stripe', $payload)->assertOk();
        $this->assertEquals('succeeded', $payment->fresh()->status);

        // Duplicate event_id is ignored.
        $this->postJson('/api/webhooks/payments/stripe', $payload)->assertOk();
        $this->assertSame(1, DB::table('payment_webhook_events')->where('event_id', 'evt_1')->count());
        $this->assertSame(1, DB::table('payment_webhook_events')->where('status', 'processed')->count());
    }

    public function test_paystack_webhook_marks_payment_succeeded(): void
    {
        $user = $this->createUser();
        $payment = \Modules\Payments\Entities\Payment::create([
            'user_id' => $user->id,
            'amount' => 10,
            'currency' => 'USD',
            'status' => 'processing',
            'method' => 'card',
            'reference' => 'PS-REF-1',
            'provider' => 'paystack',
        ]);

        $this->postJson('/api/webhooks/payments/paystack', [
            'event' => 'charge.success',
            'data' => ['reference' => 'PS-REF-1', 'id' => 99],
        ])->assertOk();

        $this->assertEquals('succeeded', $payment->fresh()->status);
    }

    public function test_kyc_submit_and_admin_review(): void
    {
        $user = $this->createUser();
        $admin = $this->createAdmin();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/kyc/submit', [
                'document_type' => 'passport',
                'document_number' => 'AB123456',
            ])
            ->assertStatus(201);

        $id = DB::table('kyc_verifications')->where('user_id', $user->id)->value('id');
        $this->assertNotNull($id);
        $this->assertEquals('submitted', DB::table('kyc_verifications')->where('id', $id)->value('status'));

        // Double-submit blocked while under review.
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/kyc/submit', [
                'document_type' => 'passport',
                'document_number' => 'AB123456',
            ])
            ->assertStatus(409);

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/kyc/{$id}/review", ['status' => 'approved'])
            ->assertOk();

        $this->assertEquals('approved', DB::table('kyc_verifications')->where('id', $id)->value('status'));
    }

    public function test_kyc_review_requires_privileged_role(): void
    {
        $user = $this->createUser();
        $id = (string) \Illuminate\Support\Str::uuid();
        DB::table('kyc_verifications')->insert([
            'id' => $id,
            'user_id' => $user->id,
            'status' => 'submitted',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/kyc/{$id}/review", ['status' => 'approved'])
            ->assertStatus(403);
    }

    public function test_finance_summary_counts_succeeded_and_completed(): void
    {
        $admin = $this->createAdmin();

        DB::table('payments')->insert([
            [
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'user_id' => $admin->id,
                'amount' => 100,
                'currency' => 'USD',
                'status' => 'succeeded',
                'method' => 'card',
                'reference' => 'FIN-S-1',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'user_id' => $admin->id,
                'amount' => 50,
                'currency' => 'USD',
                'status' => 'completed',
                'method' => 'card',
                'reference' => 'FIN-C-1',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'user_id' => $admin->id,
                'amount' => 999,
                'currency' => 'USD',
                'status' => 'failed',
                'method' => 'card',
                'reference' => 'FIN-F-1',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $res = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/finance/summary');
        $res->assertOk();
        $this->assertEquals(150.0, (float) $res->json('data.total_revenue'));
    }

    public function test_process_withdrawal_marks_paid_and_is_audited(): void
    {
        $admin = $this->createAdmin();
        $vendorId = (string) \Illuminate\Support\Str::uuid();
        $wid = (string) \Illuminate\Support\Str::uuid();

        DB::table('vendors')->insert([
            'id' => $vendorId,
            'user_id' => $admin->id,
            'store_name' => 'W Store',
            'category' => 'general',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('vendor_withdrawals')->insert([
            'id' => $wid,
            'vendor_id' => $vendorId,
            'amount' => 120,
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/admin/finance/withdrawals/{$wid}/process")
            ->assertOk();

        $this->assertEquals('paid', DB::table('vendor_withdrawals')->where('id', $wid)->value('status'));
        $this->assertSame(
            1,
            DB::table('audit_logs')->where('action', 'payout.paid')->where('entity_id', $wid)->count()
        );
    }

    public function test_payments_have_provider_and_idempotency_columns(): void
    {
        $user = $this->createUser();
        $p = \Modules\Payments\Entities\Payment::create([
            'user_id' => $user->id,
            'amount' => 5,
            'currency' => 'USD',
            'status' => 'succeeded',
            'method' => 'card',
            'reference' => 'COL-1',
            'idempotency_key' => 'col-key-1',
            'provider' => 'mock',
            'provider_payment_id' => 'txn_x',
            'metadata' => ['foo' => 'bar'],
        ]);

        $this->assertDatabaseHas('payments', [
            'id' => $p->id,
            'idempotency_key' => 'col-key-1',
            'provider' => 'mock',
            'provider_payment_id' => 'txn_x',
        ]);
    }
}
