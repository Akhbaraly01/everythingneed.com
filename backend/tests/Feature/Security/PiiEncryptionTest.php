<?php

namespace Tests\Feature\Security;

use Core\Support\PiiCipher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Modules\Authentication\Entities\TwoFactorSecret;
use Modules\Payments\Entities\Payment;
use Tests\TestCase;

/**
 * Phase 2: PII rests AES-256-GCM encrypted (APP_KEY). Plaintext legacy rows
 * are closed by security:encrypt-pii (idempotent); rotation rides on
 * APP_PREVIOUS_KEY without a plaintext window.
 */
class PiiEncryptionTest extends TestCase
{
    use RefreshDatabase;

    public function test_totp_secret_rests_encrypted_and_round_trips(): void
    {
        $user = $this->createUser();

        DB::table('two_factor_secrets')->insert([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => $user->id,
            'secret' => 'LEGACY-PLAIN-SECRET',
            'enabled' => false,
        ]);

        $rawBefore = DB::table('two_factor_secrets')->value('secret');
        $this->assertSame('LEGACY-PLAIN-SECRET', $rawBefore);

        $this->artisan('security:encrypt-pii')->assertSuccessful();

        $rawAfter = DB::table('two_factor_secrets')->value('secret');
        $this->assertNotSame('LEGACY-PLAIN-SECRET', $rawAfter);
        $this->assertTrue(PiiCipher::isEncrypted($rawAfter));
        $this->assertSame('LEGACY-PLAIN-SECRET', TwoFactorSecret::first()->secret);

        // Idempotent: a second run changes nothing.
        $this->artisan('security:encrypt-pii')->assertSuccessful();
        $this->assertSame($rawAfter, DB::table('two_factor_secrets')->value('secret'));
    }

    public function test_kyc_submit_encrypts_and_show_masks(): void
    {
        $user = $this->actingAsUser();

        $this->postJson('/api/kyc/submit', [
            'document_type' => 'passport',
            'document_number' => 'AB123456',
            'full_name' => 'Ama Serwaa',
            'nationality' => 'GHA',
        ])->assertStatus(201);

        $row = DB::table('kyc_verifications')->where('user_id', $user->id)->first();
        $this->assertNotSame('AB123456', $row->document_number);
        $this->assertTrue(PiiCipher::isEncrypted($row->document_number));
        $this->assertSame('Ama Serwaa', PiiCipher::decrypt($row->full_name));

        $this->getJson('/api/kyc')->assertOk()
            ->assertJsonPath('data.document_number_masked', '****3456')
            ->assertJsonMissingPath('data.document_number');
    }

    public function test_payment_payloads_rest_encrypted_and_read_back(): void
    {
        $payment = Payment::create([
            'user_id' => $this->createUser()->id,
            'amount' => 100,
            'currency' => 'USD',
            'status' => Payment::STATUS_PENDING,
            'method' => 'card',
            'reference' => 'probe-ref-1',
            'metadata' => ['kind' => 'probe'],
        ]);

        $raw = DB::table('payments')->where('id', $payment->id)->value('metadata');
        $this->assertNotSame('{"kind":"probe"}', $raw);
        $this->assertTrue(PiiCipher::isEncrypted($raw));
        $this->assertSame(['kind' => 'probe'], $payment->fresh()->metadata);
    }

    public function test_rotation_via_previous_key_without_plaintext_window(): void
    {
        $user = $this->createUser();

        DB::table('two_factor_secrets')->insert([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => $user->id,
            'secret' => 'LEGACY-PLAIN-SECRET',
            'enabled' => false,
        ]);

        // Ciphertext minted under a retired key decrypts while the previous
        // key is configured, then the backfill re-encrypts to the current key.
        $retired = new \Illuminate\Encryption\Encrypter(random_bytes(32), 'AES-256-GCM');
        $oldCipher = $retired->encryptString('ROTATED-SECRET');
        DB::table('two_factor_secrets')
            ->where('user_id', $user->id)
            ->update(['secret' => $oldCipher]);

        $this->assertFalse((function () use ($oldCipher) {
            try {
                Crypt::decryptString($oldCipher);
                return true;
            } catch (\Illuminate\Contracts\Encryption\DecryptException) {
                return false;
            }
        })());

        config(['app.previous_key' => 'base64:'.base64_encode($retired->getKey())]);
        $this->assertSame('ROTATED-SECRET', PiiCipher::decrypt($oldCipher));

        $this->artisan('security:encrypt-pii')->assertSuccessful();
        $fresh = DB::table('two_factor_secrets')->where('user_id', $user->id)->value('secret');
        $this->assertNotSame($oldCipher, $fresh);

        config(['app.previous_key' => '']);
        $this->assertSame('ROTATED-SECRET', PiiCipher::decrypt($fresh));
    }

    public function test_cipher_detection_and_null_safety(): void
    {
        $this->assertFalse(PiiCipher::isEncrypted(null));
        $this->assertFalse(PiiCipher::isEncrypted(''));
        $this->assertFalse(PiiCipher::isEncrypted('plain'));
        $this->assertNull(PiiCipher::decrypt(null));
        $this->assertSame('plain', PiiCipher::decrypt('plain'));
        $this->assertTrue(PiiCipher::isEncrypted(Crypt::encryptString('x')));
    }
}
