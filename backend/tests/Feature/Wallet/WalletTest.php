<?php

namespace Tests\Feature\Wallet;

use Tests\TestCase;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Core\Services\WalletService;

class WalletTest extends TestCase
{
    private WalletService $walletService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->walletService = $this->app->make(WalletService::class);
    }

    public function test_top_up_creates_wallet_and_adds_balance(): void
    {
        $user = $this->createUser();

        $tx = $this->walletService->topUp($user->id, 100.00, 'REF-TOPUP-001');

        $this->assertEquals('credit', $tx->type);
        $this->assertEquals(100.00, (float) $tx->amount);
        $this->assertEquals(100.00, (float) $tx->balance_after);
        $this->assertEquals('REF-TOPUP-001', $tx->reference);

        $balance = $this->walletService->getBalance($user->id);
        $this->assertEquals(100.00, $balance);
    }

    public function test_top_up_adds_to_existing_balance(): void
    {
        $user = $this->createUser();

        $this->walletService->topUp($user->id, 100.00, 'REF-001');
        $this->walletService->topUp($user->id, 50.00, 'REF-002');

        $balance = $this->walletService->getBalance($user->id);
        $this->assertEquals(150.00, $balance);
    }

    public function test_top_up_with_zero_amount_throws(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $user = $this->createUser();
        $this->walletService->topUp($user->id, 0, 'REF-001');
    }

    public function test_top_up_with_negative_amount_throws(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $user = $this->createUser();
        $this->walletService->topUp($user->id, -50, 'REF-001');
    }

    public function test_top_up_with_fractional_amount(): void
    {
        $user = $this->createUser();

        $tx = $this->walletService->topUp($user->id, 99.95, 'REF-FRAC');

        $this->assertEquals(99.95, (float) $tx->amount);
        $this->assertEquals(99.95, (float) $tx->balance_after);

        $balance = $this->walletService->getBalance($user->id);
        $this->assertEquals(99.95, $balance);
    }

    public function test_debit_reduces_balance(): void
    {
        $user = $this->createUser();

        $this->walletService->topUp($user->id, 200.00, 'REF-TOPUP');
        $tx = $this->walletService->debit($user->id, 75.00, 'REF-DEBIT');

        $this->assertEquals('debit', $tx->type);
        $this->assertEquals(75.00, (float) $tx->amount);
        $this->assertEquals(125.00, (float) $tx->balance_after);

        $balance = $this->walletService->getBalance($user->id);
        $this->assertEquals(125.00, $balance);
    }

    public function test_debit_insufficient_funds_throws(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Insufficient wallet balance.');

        $user = $this->createUser();
        $this->walletService->topUp($user->id, 50.00, 'REF-TOPUP');
        $this->walletService->debit($user->id, 100.00, 'REF-DEBIT');
    }

    public function test_debit_exact_balance_succeeds(): void
    {
        $user = $this->createUser();

        $this->walletService->topUp($user->id, 100.00, 'REF-TOPUP');
        $this->walletService->debit($user->id, 100.00, 'REF-DEBIT');

        $balance = $this->walletService->getBalance($user->id);
        $this->assertEquals(0.00, $balance);
    }

    public function test_debit_with_zero_amount_throws(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $user = $this->createUser();
        $this->walletService->topUp($user->id, 100.00, 'REF-TOPUP');
        $this->walletService->debit($user->id, 0, 'REF-DEBIT');
    }

    public function test_debit_with_negative_amount_throws(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $user = $this->createUser();
        $this->walletService->topUp($user->id, 100.00, 'REF-TOPUP');
        $this->walletService->debit($user->id, -10, 'REF-DEBIT');
    }

    public function test_debit_from_empty_wallet_throws(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Insufficient wallet balance.');

        $user = $this->createUser();
        $this->walletService->debit($user->id, 10.00, 'REF-DEBIT');
    }

    public function test_multiple_debits_reduce_balance_correctly(): void
    {
        $user = $this->createUser();

        $this->walletService->topUp($user->id, 300.00, 'REF-TOPUP');
        $this->walletService->debit($user->id, 100.00, 'REF-DEBIT1');
        $this->walletService->debit($user->id, 75.00, 'REF-DEBIT2');
        $this->walletService->debit($user->id, 25.00, 'REF-DEBIT3');

        $balance = $this->walletService->getBalance($user->id);
        $this->assertEquals(100.00, $balance);
    }

    public function test_transfer_between_users(): void
    {
        $sender = $this->createUser();
        $receiver = $this->createUser();

        $this->walletService->topUp($sender->id, 500.00, 'REF-TOPUP');

        $result = $this->walletService->transfer($sender->id, $receiver->id, 200.00, 'REF-TRANSFER');

        $this->assertEquals('debit', $result['debit']->type);
        $this->assertEquals('credit', $result['credit']->type);
        $this->assertEquals(200.00, (float) $result['debit']->amount);
        $this->assertEquals(200.00, (float) $result['credit']->amount);
        $this->assertEquals(300.00, (float) $result['debit']->balance_after);
        $this->assertEquals(200.00, (float) $result['credit']->balance_after);

        $senderBalance = $this->walletService->getBalance($sender->id);
        $receiverBalance = $this->walletService->getBalance($receiver->id);

        $this->assertEquals(300.00, $senderBalance);
        $this->assertEquals(200.00, $receiverBalance);
    }

    public function test_transfer_to_self_throws(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Cannot transfer to the same wallet.');

        $user = $this->createUser();
        $this->walletService->topUp($user->id, 100.00, 'REF-TOPUP');
        $this->walletService->transfer($user->id, $user->id, 50.00, 'REF-TRANSFER');
    }

    public function test_transfer_insufficient_funds_throws(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Insufficient wallet balance.');

        $sender = $this->createUser();
        $receiver = $this->createUser();

        $this->walletService->topUp($sender->id, 50.00, 'REF-TOPUP');
        $this->walletService->transfer($sender->id, $receiver->id, 100.00, 'REF-TRANSFER');
    }

    public function test_transfer_negative_amount_throws(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $sender = $this->createUser();
        $receiver = $this->createUser();
        $this->walletService->topUp($sender->id, 100.00, 'REF-TOPUP');
        $this->walletService->transfer($sender->id, $receiver->id, -50, 'REF-TRANSFER');
    }

    public function test_transfer_zero_amount_throws(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $sender = $this->createUser();
        $receiver = $this->createUser();
        $this->walletService->topUp($sender->id, 100.00, 'REF-TOPUP');
        $this->walletService->transfer($sender->id, $receiver->id, 0, 'REF-TRANSFER');
    }

    public function test_transfer_to_new_user_creates_their_wallet(): void
    {
        $sender = $this->createUser();
        $receiver = $this->createUser();

        $this->walletService->topUp($sender->id, 300.00, 'REF-TOPUP');
        $this->walletService->transfer($sender->id, $receiver->id, 150.00, 'REF-TRANSFER');

        $this->assertDatabaseHas('wallets', [
            'user_id' => $receiver->id,
            'balance' => 150.00,
            'currency' => 'USD',
        ]);
    }

    public function test_get_balance_returns_zero_for_new_user(): void
    {
        $user = $this->createUser();

        $balance = $this->walletService->getBalance($user->id);
        $this->assertEquals(0.00, $balance);
    }

    public function test_wallet_record_created_with_correct_defaults(): void
    {
        $user = $this->createUser();

        $this->walletService->topUp($user->id, 50.00, 'REF-001');

        $this->assertDatabaseHas('wallets', [
            'user_id' => $user->id,
            'balance' => 50.00,
            'currency' => 'USD',
        ]);
    }

    public function test_wallet_balance_is_accurate_after_mixed_operations(): void
    {
        $user = $this->createUser();

        $this->walletService->topUp($user->id, 500.00, 'REF-TOPUP');
        $this->walletService->debit($user->id, 120.50, 'REF-DEBIT1');
        $this->walletService->topUp($user->id, 30.25, 'REF-TOPUP2');
        $this->walletService->debit($user->id, 10.75, 'REF-DEBIT2');

        $balance = $this->walletService->getBalance($user->id);
        $this->assertEquals(399.00, $balance);
    }

    public function test_top_up_records_wallet_transaction(): void
    {
        $user = $this->createUser();

        $this->walletService->topUp($user->id, 100.00, 'REF-CREDIT');

        $wallet = Wallet::where('user_id', $user->id)->first();

        $this->assertDatabaseHas('wallet_transactions', [
            'wallet_id' => $wallet->id,
            'type' => 'credit',
            'amount' => 100.00,
            'reference' => 'REF-CREDIT',
        ]);
    }

    public function test_debit_records_wallet_transaction(): void
    {
        $user = $this->createUser();

        $this->walletService->topUp($user->id, 100.00, 'REF-TOPUP');
        $this->walletService->debit($user->id, 30.00, 'REF-DEBIT');

        $wallet = Wallet::where('user_id', $user->id)->first();

        $this->assertDatabaseHas('wallet_transactions', [
            'wallet_id' => $wallet->id,
            'type' => 'debit',
            'amount' => 30.00,
            'reference' => 'REF-DEBIT',
        ]);
    }

    public function test_transfer_records_two_transactions(): void
    {
        $sender = $this->createUser();
        $receiver = $this->createUser();

        $this->walletService->topUp($sender->id, 300.00, 'REF-TOPUP');
        $this->walletService->transfer($sender->id, $receiver->id, 150.00, 'REF-TRANSFER');

        $senderWallet = Wallet::where('user_id', $sender->id)->first();
        $receiverWallet = Wallet::where('user_id', $receiver->id)->first();

        $this->assertDatabaseHas('wallet_transactions', [
            'wallet_id' => $senderWallet->id,
            'type' => 'debit',
            'amount' => 150.00,
            'reference' => 'REF-TRANSFER',
        ]);

        $this->assertDatabaseHas('wallet_transactions', [
            'wallet_id' => $receiverWallet->id,
            'type' => 'credit',
            'amount' => 150.00,
            'reference' => 'REF-TRANSFER',
        ]);
    }

    public function test_each_user_has_separate_wallet(): void
    {
        $user1 = $this->createUser();
        $user2 = $this->createUser();

        $this->walletService->topUp($user1->id, 100.00, 'REF-U1');
        $this->walletService->topUp($user2->id, 250.00, 'REF-U2');

        $this->assertEquals(100.00, $this->walletService->getBalance($user1->id));
        $this->assertEquals(250.00, $this->walletService->getBalance($user2->id));

        $wallets = Wallet::all();
        $this->assertCount(2, $wallets);
    }

    public function test_balance_after_tracks_correctly_through_operations(): void
    {
        $user = $this->createUser();

        $tx1 = $this->walletService->topUp($user->id, 100.00, 'REF-1');
        $this->assertEquals(100.00, (float) $tx1->balance_after);

        $tx2 = $this->walletService->debit($user->id, 40.00, 'REF-2');
        $this->assertEquals(60.00, (float) $tx2->balance_after);

        $tx3 = $this->walletService->topUp($user->id, 20.00, 'REF-3');
        $this->assertEquals(80.00, (float) $tx3->balance_after);
    }

    public function test_top_up_with_large_amount(): void
    {
        $user = $this->createUser();

        $tx = $this->walletService->topUp($user->id, 999999.99, 'REF-LARGE');

        $this->assertEquals(999999.99, (float) $tx->amount);

        $balance = $this->walletService->getBalance($user->id);
        $this->assertEquals(999999.99, $balance);
    }

    public function test_top_up_is_atomic_on_success(): void
    {
        $user = $this->createUser();

        $this->walletService->topUp($user->id, 100.00, 'REF-ATOMIC');

        $wallet = Wallet::where('user_id', $user->id)->first();
        $transaction = WalletTransaction::where('wallet_id', $wallet->id)->first();

        $this->assertEquals((float) $wallet->balance, (float) $transaction->balance_after);
    }
}
