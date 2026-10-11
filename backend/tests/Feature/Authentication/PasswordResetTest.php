<?php

namespace Tests\Feature\Authentication;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Modules\Authentication\Mail\ResetPasswordMail;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_forgot_sends_reset_email_and_returns_dev_token(): void
    {
        Mail::fake();

        $user = User::factory()->create();

        $response = $this->postJson('/api/auth/reset-password', [
            'email' => $user->email,
        ]);

        $response->assertStatus(200);
        Mail::assertSent(
            ResetPasswordMail::class,
            fn (ResetPasswordMail $mail) => $mail->hasTo($user->email),
        );

        // Non-production returns the token for local tooling
        $this->assertNotNull($response->json('token'));

        // Token stored hashed, never plaintext
        $row = DB::table('password_reset_tokens')->where('email', $user->email)->first();
        $this->assertNotNull($row);
        $this->assertTrue(Hash::check($response->json('token'), $row->token));
    }

    public function test_forgot_response_does_not_leak_account_existence(): void
    {
        Mail::fake();

        $ghost = $this->postJson('/api/auth/reset-password', ['email' => 'nobody@nowhere.tld']);
        $real = User::factory()->create();
        $known = $this->postJson('/api/auth/reset-password', ['email' => $real->email]);

        $this->assertEquals(
            $ghost->json('message'),
            $known->json('message'),
        );
        $this->assertNull($ghost->json('token'));
        Mail::assertSent(ResetPasswordMail::class, 1);
    }

    public function test_confirm_resets_password_and_invalidates_sessions(): void
    {
        Mail::fake();

        $user = User::factory()->create(['password' => bcrypt('old-secret')]);
        $this->actingAs($user, 'sanctum'); // creates a personal access token

        $forgot = $this->postJson('/api/auth/reset-password', ['email' => $user->email]);
        $token = $forgot->json('token');

        $confirm = $this->postJson('/api/auth/confirm-reset', [
            'token' => $token,
            'newPassword' => 'brand-new-pass',
        ]);
        $confirm->assertStatus(200);

        $user->refresh();
        $this->assertTrue(Hash::check('brand-new-pass', $user->password));
        $this->assertFalse(Hash::check('old-secret', $user->password));

        // Token consumed
        $this->assertEquals(0, DB::table('password_reset_tokens')->where('email', $user->email)->count());

        // Prior API sessions revoked after credential change
        $this->assertEquals(0, $user->tokens()->count());
    }

    public function test_expired_token_is_rejected(): void
    {
        $user = User::factory()->create();

        DB::table('password_reset_tokens')->insert([
            'email' => $user->email,
            'token' => Hash::make('expired-token'),
            'created_at' => now()->subHours(2),
        ]);

        $this->postJson('/api/auth/confirm-reset', [
            'token' => 'expired-token',
            'newPassword' => 'another-pass',
        ])->assertStatus(422);
    }

    public function test_login_works_with_new_password_after_reset(): void
    {
        Mail::fake();

        $user = User::factory()->create(['password' => bcrypt('old-secret')]);
        $token = $this->postJson('/api/auth/reset-password', ['email' => $user->email])->json('token');
        $this->postJson('/api/auth/confirm-reset', [
            'token' => $token,
            'newPassword' => 'fresh-login-1',
        ])->assertStatus(200);

        $login = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'fresh-login-1',
        ]);
        $login->assertStatus(200);

        $stale = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'old-secret',
        ]);
        $stale->assertStatus(401);
    }

    public function test_web_password_reset_revokes_api_tokens(): void
    {
        $user = User::factory()->create(['password' => bcrypt('old-secret')]);

        // A live API session exists before the reset.
        $user->createToken('auth-token')->plainTextToken;
        $this->assertEquals(1, $user->tokens()->count());

        // Web broker token (same hashing as Password::sendResetLink).
        $token = 'web-reset-token-123';
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            ['token' => Hash::make($token), 'created_at' => now()]
        );

        $this->post('/reset-password', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'new-web-pass-1',
            'password_confirmation' => 'new-web-pass-1',
        ])->assertRedirect(route('login'));

        $user->refresh();
        $this->assertTrue(Hash::check('new-web-pass-1', $user->password));

        // Every prior API token must be revoked with the credential change.
        $this->assertEquals(0, $user->tokens()->count());
    }
}