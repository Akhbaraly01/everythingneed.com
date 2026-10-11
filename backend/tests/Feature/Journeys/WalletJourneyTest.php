<?php

namespace Tests\Feature\Journeys;

use Tests\TestCase;

class WalletJourneyTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config(['payments.driver' => 'mock']);
    }

    public function test_deposit_journey_updates_balance_and_transaction_history(): void
    {
        $user = $this->actingAsUser();

        // Fresh wallet starts at zero
        $this->getJson('/api/wallet/balance')
            ->assertOk()
            ->assertJsonPath('data.currency', 'USD');
        $this->assertEquals(0.0, (float) $this->getJson('/api/wallet/balance')->json('data.balance'));

        // Deposit
        $this->postJson('/api/wallet/deposit', [
            'amount' => 100,
            'payment_method' => 'card',
            'idempotency_key' => 'dep-journey-1',
        ])->assertOk()->assertJsonFragment(['message' => 'Deposit successful']);

        $this->assertEquals(100.0, (float) $this->getJson('/api/wallet/balance')->json('data.balance'));

        // History shows the credit with running balance
        $txs = $this->getJson('/api/wallet/transactions')->assertOk();
        $this->assertSame(1, count($txs->json('data')));
        $this->assertSame('credit', $txs->json('data.0.type'));
        $this->assertStringStartsWith('WALLET-DEP-', (string) $txs->json('data.0.reference'));
        $this->assertEquals(100.0, (float) $txs->json('data.0.balance_after'));

        // Idempotent replay of the same key never double-credits
        $this->postJson('/api/wallet/deposit', [
            'amount' => 100,
            'payment_method' => 'card',
            'idempotency_key' => 'dep-journey-1',
        ])->assertOk();
        $this->assertEquals(100.0, (float) $this->getJson('/api/wallet/balance')->json('data.balance'));
        $this->assertSame(1, $this->getJson('/api/wallet/transactions')->json('meta.total'));
    }

    public function test_deposit_validates_amount_and_method(): void
    {
        $this->actingAsUser();

        $this->postJson('/api/wallet/deposit', ['amount' => 0.5, 'payment_method' => 'card'])
            ->assertStatus(422);
        $this->postJson('/api/wallet/deposit', ['amount' => 10])
            ->assertStatus(422);
        $this->postJson('/api/wallet/deposit', ['amount' => 10, 'payment_method' => 'card'])
            ->assertOk();
        $this->assertEquals(10.0, (float) $this->getJson('/api/wallet/balance')->json('data.balance'));
    }

    public function test_wallet_endpoints_require_authentication(): void
    {
        $this->getJson('/api/wallet/balance')->assertStatus(401);
        $this->getJson('/api/wallet/transactions')->assertStatus(401);
        $this->postJson('/api/wallet/deposit', ['amount' => 10, 'payment_method' => 'card'])
            ->assertStatus(401);
    }
}
