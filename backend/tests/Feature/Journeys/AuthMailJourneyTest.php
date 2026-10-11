<?php

namespace Tests\Feature\Journeys;

use Illuminate\Support\Facades\Mail;
use App\Models\User;
use Tests\TestCase;

class AuthMailJourneyTest extends TestCase
{
    /**
     * Mirror of AuthService::verifyTotp generation (base32 decode + HMAC-SHA1 TOTP).
     */
    private function validTotp(string $secret): string
    {
        $map = [
            'A' => 0, 'B' => 1, 'C' => 2, 'D' => 3, 'E' => 4, 'F' => 5,
            'G' => 6, 'H' => 7, 'I' => 8, 'J' => 9, 'K' => 10, 'L' => 11,
            'M' => 12, 'N' => 13, 'O' => 14, 'P' => 15, 'Q' => 16, 'R' => 17,
            'S' => 18, 'T' => 19, 'U' => 20, 'V' => 21, 'W' => 22, 'X' => 23,
            'Y' => 24, 'Z' => 25, '2' => 26, '3' => 27, '4' => 28, '5' => 29,
            '6' => 30, '7' => 31,
        ];

        $input = strtoupper(rtrim($secret, '='));
        $buffer = 0;
        $bitsLeft = 0;
        $key = '';
        for ($i = 0; $i < strlen($input); $i++) {
            $val = $map[$input[$i]] ?? -1;
            if ($val < 0) {
                continue;
            }
            $buffer = ($buffer << 5) | $val;
            $bitsLeft += 5;
            if ($bitsLeft >= 8) {
                $bitsLeft -= 8;
                $key .= chr(($buffer >> $bitsLeft) & 0xff);
            }
        }

        $counter = pack('N*', 0) . pack('N*', (int) floor(time() / 30));
        $hash = hash_hmac('sha1', $counter, $key, true);
        $offset = ord($hash[19]) & 0xf;
        $otp = (
            ((ord($hash[$offset]) & 0x7f) << 24) |
            ((ord($hash[$offset + 1]) & 0xff) << 16) |
            ((ord($hash[$offset + 2]) & 0xff) << 8) |
            (ord($hash[$offset + 3]) & 0xff)
        ) % 1000000;

        return str_pad((string) $otp, 6, '0', STR_PAD_LEFT);
    }

    private function enableTwoFactorFor(User $user): string
    {
        $this->actingAs($user, 'sanctum');
        $secret = $this->postJson('/api/auth/2fa/enable')
            ->assertOk()
            ->json('data.secret');
        $this->postJson('/api/auth/2fa/verify', ['code' => $this->validTotp($secret)])
            ->assertOk();
        $this->assertDatabaseHas('two_factor_secrets', [
            'user_id' => $user->id,
            'enabled' => true,
        ]);

        return $secret;
    }

    public function test_full_2fa_login_happy_path_over_http(): void
    {
        $password = 'S3cure-login-pass';
        $user = User::factory()->create(['password' => bcrypt($password), 'email_verified_at' => now()]);
        $this->enableTwoFactorFor($user);

        // Step 1: credentials alone are not enough anymore
        $step1 = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => $password,
        ]);
        $step1->assertOk()
            ->assertJsonPath('data.requires_2fa', true)
            ->assertJsonStructure(['data' => ['pending_token']])
            ->assertJsonPath('data.access_token', null);
        $pending = $step1->json('data.pending_token');

        // Step 2: TOTP completes the login
        $secret = $user->twoFactorSecret()->first()->secret;
        $step2 = $this->postJson('/api/auth/2fa/login', [
            'pending_token' => $pending,
            'code' => $this->validTotp($secret),
        ]);
        $step2->assertOk()
            ->assertJsonPath('message', 'Login successful')
            ->assertJsonStructure(['data' => ['access_token', 'user' => ['id', 'email']]]);

        // The issued token authenticates API calls
        $this->withToken($step2->json('data.access_token'))
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('data.user.email', $user->email);
    }

    public function test_2fa_login_rejects_wrong_code_and_reused_pending_token_with_422(): void
    {
        $password = 'S3cure-login-pass';
        $user = User::factory()->create(['password' => bcrypt($password), 'email_verified_at' => now()]);
        $this->enableTwoFactorFor($user);

        $pending = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => $password,
        ])->json('data.pending_token');

        // Wrong code → 422, and it burns the one-shot pending token
        $this->postJson('/api/auth/2fa/login', [
            'pending_token' => $pending,
            'code' => '000000',
        ])->assertStatus(422);

        // Retrying with the correct code on the burned token → 422
        $secret = $user->twoFactorSecret()->first()->secret;
        $this->postJson('/api/auth/2fa/login', [
            'pending_token' => $pending,
            'code' => $this->validTotp($secret),
        ])->assertStatus(422);

        // A fresh login issues a new pending token that completes normally
        $pending2 = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => $password,
        ])->json('data.pending_token');
        $this->postJson('/api/auth/2fa/login', [
            'pending_token' => $pending2,
            'code' => $this->validTotp($secret),
        ])->assertOk();
    }

    public function test_mail_disabled_password_reset_completes_without_sending_mail(): void
    {
        config(['verification.mail_enabled' => false]);
        Mail::fake();

        $user = User::factory()->create(['password' => bcrypt('old-secret')]);
        $this->actingAs($user, 'sanctum');

        $forgot = $this->postJson('/api/auth/reset-password', ['email' => $user->email]);
        $forgot->assertStatus(200);
        $token = $forgot->json('token');
        $this->assertNotNull($token, 'Non-production still returns the reset token');
        Mail::assertNothingSent();

        $this->postJson('/api/auth/confirm-reset', [
            'token' => $token,
            'newPassword' => 'brand-new-pass',
        ])->assertStatus(200);

        // New credentials work without any mailer involvement
        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'brand-new-pass',
        ])->assertOk()->assertJsonStructure(['data' => ['access_token']]);
        Mail::assertNothingSent();
    }

    public function test_mail_disabled_web_registration_auto_verifies_and_reaches_dashboard(): void
    {
        config(['verification.mail_enabled' => false]);
        Mail::fake();

        $response = $this->post('/register', [
            'name' => 'Mail Off User',
            'email' => 'mail-off@everythingneed.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertRedirect();
        $this->assertAuthenticated();

        $user = User::where('email', 'mail-off@everythingneed.test')->first();
        $this->assertNotNull($user);
        $this->assertNotNull($user->email_verified_at, 'MAIL_ENABLED=false must auto-verify new accounts');

        $this->get('/dashboard')->assertOk();
        Mail::assertNothingSent();
    }
}
