<?php

namespace Tests\Feature\WaveI;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Modules\Payments\Entities\Payment;
use Tests\TestCase;

class WaveIWalletKycTest extends TestCase
{
    use RefreshDatabase;

    private function verifyUser(User $user): void
    {
        DB::table('kyc_verifications')->insert([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => $user->id,
            'status' => 'approved',
            'document_type' => 'passport',
            'document_number' => 'V12345',
            'verified_at' => now(),
            'submitted_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_kyc_show_is_redacted_and_reports_the_spec_state(): void
    {
        $user = $this->createUser();
        $this->verifyUser($user);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/kyc');
        $response->assertOk()
            ->assertJsonPath('data.status', 'approved')
            ->assertJsonPath('data.verification_state', 'verified')
            ->assertJsonPath('data.document_number_masked', '****2345');

        $data = $response->json('data');
        $this->assertArrayNotHasKey('document_number', $data);
        $this->assertArrayNotHasKey('document_front_path', $data);
        $this->assertArrayNotHasKey('document_back_path', $data);
        $this->assertArrayNotHasKey('reviewed_by', $data);
    }

    public function test_kyc_show_without_a_row_reports_not_started(): void
    {
        $user = $this->createUser();

        $this->actingAs($user, 'sanctum')->getJson('/api/kyc')
            ->assertOk()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.verification_state', 'not_started');
    }

    public function test_kyc_submit_records_identity_and_rejects_foreign_document_paths(): void
    {
        $user = $this->createUser();

        $this->actingAs($user, 'sanctum')->postJson('/api/kyc/submit', [
            'document_type' => 'national_id',
            'document_number' => 'ID-999',
            'document_front_path' => 'uploads/u/someone-else/kyc-documents/evil.jpg',
            'full_name' => 'Ama Test',
            'nationality' => 'GHA',
        ])->assertStatus(422);

        $this->actingAs($user, 'sanctum')->postJson('/api/kyc/submit', [
            'document_type' => 'national_id',
            'document_number' => 'ID-999',
            'document_front_path' => "uploads/u/{$user->id}/kyc-documents/id-front.jpg",
            'full_name' => 'Ama Test',
            'nationality' => 'GHA',
            'date_of_birth' => '1990-01-01',
        ])->assertStatus(201)
            ->assertJsonPath('data.status', 'submitted')
            ->assertJsonPath('data.verification_state', 'under_review');

        $this->assertDatabaseHas('kyc_verifications', [
            'user_id' => $user->id,
            'full_name' => 'Ama Test',
            'nationality' => 'GHA',
            'attempts' => 1,
        ]);
    }

    public function test_requires_action_loops_back_to_resubmission_with_attempts(): void
    {
        $user = $this->createUser();
        $admin = $this->createAdmin();

        $this->actingAs($user, 'sanctum')->postJson('/api/kyc/submit', [
            'document_type' => 'passport',
            'document_number' => 'P-1',
        ])->assertStatus(201);
        $id = DB::table('kyc_verifications')->where('user_id', $user->id)->value('id');

        // Reason is mandatory when the decision is not an approval.
        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/kyc/{$id}/review", ['status' => 'requires_action'])
            ->assertStatus(422);

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/kyc/{$id}/review", [
                'status' => 'requires_action',
                'rejection_reason' => 'Back side unreadable',
            ])->assertOk();

        $this->assertSame(
            'requires_action',
            DB::table('kyc_verifications')->where('id', $id)->value('status')
        );

        // The user resubmits; the attempt counter keeps the history.
        $this->actingAs($user, 'sanctum')->postJson('/api/kyc/submit', [
            'document_type' => 'passport',
            'document_number' => 'P-1',
        ])->assertStatus(201);

        $this->assertDatabaseHas('kyc_verifications', [
            'user_id' => $user->id,
            'status' => 'submitted',
            'attempts' => 2,
        ]);

        $secondId = DB::table('kyc_verifications')
            ->where('user_id', $user->id)->orderByDesc('created_at')->value('id');

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/kyc/{$secondId}/review", ['status' => 'approved'])
            ->assertOk();

        $row = DB::table('kyc_verifications')->where('id', $secondId)->first();
        $this->assertSame('approved', $row->status);
        $this->assertNotNull($row->verified_at);
    }

    public function test_decided_kyc_cannot_be_reviewed_twice(): void
    {
        $user = $this->createUser();
        $admin = $this->createAdmin();

        $this->actingAs($user, 'sanctum')->postJson('/api/kyc/submit', [
            'document_type' => 'passport',
            'document_number' => 'P-9',
        ])->assertStatus(201);
        $id = DB::table('kyc_verifications')->where('user_id', $user->id)->value('id');

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/kyc/{$id}/review", ['status' => 'rejected', 'rejection_reason' => 'Expired'])
            ->assertOk();

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/kyc/{$id}/review", ['status' => 'approved'])
            ->assertStatus(422);
    }

    public function test_kyc_documents_upload_and_stream_with_scoping(): void
    {
        Storage::fake('public');
        $user = $this->createUser();
        $stranger = $this->createUser();
        $admin = $this->createAdmin();

        $upload = $this->actingAs($user, 'sanctum')->post('/api/upload', [
            'file' => UploadedFile::fake()->image('id-front.jpg'),
            'folder' => 'kyc-documents',
        ])->assertStatus(201);
        $path = $upload->json('data.path');
        $this->assertStringStartsWith("uploads/u/{$user->id}/kyc-documents/", $path);

        $this->actingAs($user, 'sanctum')->postJson('/api/kyc/submit', [
            'document_type' => 'passport',
            'document_number' => 'DOC-1',
            'document_front_path' => $path,
        ])->assertStatus(201);
        $id = DB::table('kyc_verifications')->where('user_id', $user->id)->value('id');

        // Owner streams their own file; strangers get nothing.
        $this->actingAs($user, 'sanctum')->get("/api/kyc/documents/front")->assertOk();
        $this->actingAs($stranger, 'sanctum')->get("/api/kyc/documents/front")->assertStatus(404);
        $this->actingAs($user, 'sanctum')->get("/api/kyc/documents/back")->assertStatus(404);

        // Privileged reviewers stream the submission; plain users cannot.
        $this->actingAs($admin, 'sanctum')->get("/api/kyc/{$id}/documents/front")->assertOk();
        $this->actingAs($stranger, 'sanctum')->get("/api/kyc/{$id}/documents/front")->assertStatus(403);
    }

    public function test_withdraw_and_transfer_require_verified_kyc(): void
    {
        $user = $this->createUser();
        $recipient = $this->createUser();

        app(\Core\Services\Contracts\WalletServiceInterface::class)->topUp($user->id, 100, 'SEED-I-1');

        $this->actingAs($user, 'sanctum')->postJson('/api/wallet/withdraw', [
            'amount' => 10,
        ])->assertStatus(403);

        $this->actingAs($user, 'sanctum')->postJson('/api/wallet/transfer', [
            'to_user_id' => $recipient->id,
            'amount' => 10,
        ])->assertStatus(403);

        $this->verifyUser($user);

        $this->actingAs($user, 'sanctum')->postJson('/api/wallet/withdraw', [
            'amount' => 10,
        ])->assertOk();

        $this->actingAs($user, 'sanctum')->postJson('/api/wallet/transfer', [
            'to_user_id' => $recipient->id,
            'amount' => 15,
            'idempotency_key' => 'wavei-trf-1',
        ])->assertStatus(201);

        $core = app(\Core\Services\Contracts\WalletServiceInterface::class);
        $this->assertEqualsWithDelta(75.0, $core->getBalance($user->id), 0.01);
        $this->assertEqualsWithDelta(15.0, $core->getBalance($recipient->id), 0.01);

        $this->assertDatabaseHas('wallet_transactions', [
            'reference' => 'wavei-trf-1',
            'type' => 'debit',
        ]);
        $this->assertDatabaseHas('wallet_transactions', [
            'reference' => 'wavei-trf-1',
            'type' => 'credit',
        ]);
    }

    public function test_withdraw_respects_active_holds_and_fails_honestly_when_short(): void
    {
        $user = $this->createUser();
        $this->verifyUser($user);
        $core = app(\Core\Services\Contracts\WalletServiceInterface::class);
        $core->topUp($user->id, 100, 'SEED-I-2');

        $this->actingAs($user, 'sanctum')->postJson('/api/wallet/holds', [
            'amount' => 90,
            'reference' => 'wavei-hold-1',
        ])->assertStatus(201);

        $this->actingAs($user, 'sanctum')->getJson('/api/wallet/available')
            ->assertOk()
            ->assertJsonPath('data.balance', 100)
            ->assertJsonPath('data.available', 10)
            ->assertJsonPath('data.pending', 90);

        // Only 10 is spendable: the held 90 is protected.
        $this->actingAs($user, 'sanctum')->postJson('/api/wallet/withdraw', [
            'amount' => 50,
        ])->assertStatus(422)
            ->assertJsonFragment(['error' => 'INSUFFICIENT_FUNDS']);

        $this->actingAs($user, 'sanctum')->postJson('/api/wallet/withdraw', [
            'amount' => 10,
        ])->assertOk();
    }

    public function test_wallet_payment_moves_real_ledger_money_for_verified_funded_wallets(): void
    {
        config(['payments.driver' => 'mock']);
        $user = $this->createUser();
        $this->verifyUser($user);

        app(\Modules\Wallet\Services\WalletService::class)
            ->deposit($user->id, 100, 'card', 'wavei-pay-fund-1');

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/payments/charge', [
            'amount' => 40,
            'method' => 'wallet',
        ])->assertStatus(201);

        $payment = Payment::findOrFail($response->json('data.id'));
        $this->assertSame('wallet', $payment->method);
        $this->assertSame('wallet', $payment->provider);
        $this->assertSame('succeeded', $payment->status);
        $this->assertSame('checkout', $payment->purpose);

        $core = app(\Core\Services\Contracts\WalletServiceInterface::class);
        $this->assertEqualsWithDelta(60.0, $core->getBalance($user->id), 0.01);
        $this->assertDatabaseHas('wallet_transactions', [
            'reference' => 'WALLET-PAY-'.$payment->id,
            'type' => 'debit',
            'amount' => 40,
        ]);
    }

    public function test_wallet_payment_fallbacks_stay_honest(): void
    {
        config(['payments.driver' => 'mock']);

        // Funded but unverified: holders must verify before spending.
        $holder = $this->createUser();
        app(\Core\Services\Contracts\WalletServiceInterface::class)->topUp($holder->id, 100, 'SEED-I-3');
        $this->actingAs($holder, 'sanctum')->postJson('/api/payments/charge', [
            'amount' => 40,
            'method' => 'wallet',
        ])->assertStatus(403);

        // Verified but short: an honest 422, nothing moves.
        $short = $this->createUser();
        $this->verifyUser($short);
        app(\Core\Services\Contracts\WalletServiceInterface::class)->topUp($short->id, 5, 'SEED-I-4');
        $this->actingAs($short, 'sanctum')->postJson('/api/payments/charge', [
            'amount' => 40,
            'method' => 'wallet',
        ])->assertStatus(422);

        // No funds at all: the pinned sandbox recording contract holds.
        $bare = $this->createUser();
        $this->actingAs($bare, 'sanctum')->postJson('/api/payments/charge', [
            'amount' => 40,
            'method' => 'wallet',
        ])->assertStatus(201)
            ->assertJsonPath('data.status', 'succeeded');
        $this->assertDatabaseHas('payments', ['user_id' => $bare->id, 'method' => 'wallet']);
    }

    public function test_wallet_payment_refund_returns_money_to_the_wallet(): void
    {
        config(['payments.driver' => 'mock']);
        $user = $this->createUser();
        $this->verifyUser($user);

        app(\Modules\Wallet\Services\WalletService::class)
            ->deposit($user->id, 100, 'card', 'wavei-ref-fund-1');

        $charge = $this->actingAs($user, 'sanctum')->postJson('/api/payments/charge', [
            'amount' => 40,
            'method' => 'wallet',
        ])->assertStatus(201);
        $paymentId = $charge->json('data.id');

        $core = app(\Core\Services\Contracts\WalletServiceInterface::class);
        $this->assertEqualsWithDelta(60.0, $core->getBalance($user->id), 0.01);

        $refunder = app(\Modules\Payments\Actions\RefundPayment::class);
        $refunder->execute($paymentId, 15);
        $this->assertSame('partially_refunded', Payment::find($paymentId)->status);
        $this->assertEqualsWithDelta(75.0, $core->getBalance($user->id), 0.01);

        $refunder->execute($paymentId, 25);
        $this->assertSame('refunded', Payment::find($paymentId)->status);
        $this->assertEqualsWithDelta(100.0, $core->getBalance($user->id), 0.01);

        $this->assertDatabaseHas('wallet_transactions', [
            'type' => 'credit',
            'amount' => 25,
        ]);
    }

    public function test_transaction_details_are_owner_scoped(): void
    {
        $user = $this->createUser();
        $stranger = $this->createUser();
        $core = app(\Core\Services\Contracts\WalletServiceInterface::class);
        $tx = $core->topUp($user->id, 20, 'SEED-I-5');

        $this->getJson("/api/wallet/transactions/{$tx->id}")->assertStatus(401);

        $this->actingAs($user, 'sanctum')
            ->getJson("/api/wallet/transactions/{$tx->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $tx->id)
            ->assertJsonPath('data.amount', '20.00');

        $this->actingAs($stranger, 'sanctum')
            ->getJson("/api/wallet/transactions/{$tx->id}")
            ->assertStatus(404);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/wallet/transactions/00000000-0000-0000-0000-000000000000')
            ->assertStatus(404);
    }

    public function test_transaction_history_filters_by_type(): void
    {
        $user = $this->createUser();
        $core = app(\Core\Services\Contracts\WalletServiceInterface::class);
        $core->topUp($user->id, 50, 'SEED-I-6');
        $core->debit($user->id, 10, 'SEED-I-7');

        $credits = $this->actingAs($user, 'sanctum')
            ->getJson('/api/wallet/transactions?type=credit')
            ->assertOk();
        $this->assertSame(1, $credits->json('meta.total'));

        $debits = $this->actingAs($user, 'sanctum')
            ->getJson('/api/wallet/transactions?type=debit')
            ->assertOk();
        $this->assertSame(1, $debits->json('meta.total'));
    }

    public function test_payment_methods_offer_wallet_only_to_verified_funded_users(): void
    {
        $bare = $this->createUser();
        $res = $this->actingAs($bare, 'sanctum')->getJson('/api/payments/methods')->assertOk();
        $this->assertFalse(collect($res->json('data.methods'))->contains('id', 'wallet'));

        $verified = $this->createUser();
        $this->verifyUser($verified);
        $res = $this->actingAs($verified, 'sanctum')->getJson('/api/payments/methods')->assertOk();
        $wallet = collect($res->json('data.methods'))->firstWhere('id', 'wallet');
        $this->assertNotNull($wallet);
        $this->assertFalse($wallet['enabled']);

        app(\Core\Services\Contracts\WalletServiceInterface::class)->topUp($verified->id, 30, 'SEED-I-8');
        $res = $this->actingAs($verified, 'sanctum')->getJson('/api/payments/methods')->assertOk();
        $wallet = collect($res->json('data.methods'))->firstWhere('id', 'wallet');
        $this->assertTrue($wallet['enabled']);
        $this->assertEqualsWithDelta(30.0, (float) $wallet['available'], 0.01);
    }

    public function test_reconcile_flags_broken_transfer_pairs_and_negative_availability(): void
    {
        $a = $this->createUser();
        $b = $this->createUser();
        $core = app(\Core\Services\Contracts\WalletServiceInterface::class);
        $core->topUp($a->id, 100, 'SEED-I-9');
        $core->transfer($a->id, $b->id, 20, 'WAVEI-PAIR-1');

        // Simulate a half-written transfer: the credit leg never landed.
        $creditWalletId = DB::table('wallets')->where('user_id', $b->id)->value('id');
        DB::table('wallet_transactions')
            ->where('wallet_id', $creditWalletId)
            ->where('reference', 'WAVEI-PAIR-1')
            ->delete();

        // Simulate an over-committed wallet: hold larger than the balance.
        $core->hold($a->id, 10, 'WAVEI-HOLD-9');
        DB::table('wallets')->where('user_id', $a->id)->update(['balance' => 5]);

        $this->artisan('financial:reconcile')
            ->expectsOutputToContain('Incomplete transfers: 1')
            ->expectsOutputToContain('Negative availability: 1')
            ->assertExitCode(0);
    }
}
