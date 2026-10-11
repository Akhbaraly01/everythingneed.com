<?php

namespace Tests\Feature\Authentication;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Authentication\Entities\TwoFactorSecret;
use Tests\TestCase;

/**
 * Plan Q: the web guard enforces authenticator-app 2FA like the API does
 * (previously web login skipped it), and suspended accounts land on a
 * real appeal page instead of a bare error string.
 */
class WebTwoFactorTest extends TestCase
{
    use RefreshDatabase;

    private const SECRET = 'JBSWY3DPEHPK3PXP';

    private function enable2fa(User $user): void
    {
        TwoFactorSecret::create([
            'user_id' => $user->id,
            'secret' => self::SECRET,
            'enabled' => true,
            'verified_at' => now(),
        ]);
    }

    private function totp(string $secret): string
    {
        $map = array_flip(array_merge(range('A', 'Z'), ['2', '3', '4', '5', '6', '7']));
        $buffer = 0;
        $bitsLeft = 0;
        $key = '';
        foreach (str_split(strtoupper(rtrim($secret, '='))) as $char) {
            $buffer = ($buffer << 5) | $map[$char];
            $bitsLeft += 5;
            if ($bitsLeft >= 8) {
                $bitsLeft -= 8;
                $key .= chr(($buffer >> $bitsLeft) & 0xFF);
            }
        }
        $counter = pack('N*', 0, (int) floor(time() / 30));
        $hash = hash_hmac('sha1', $counter, $key, true);
        $offset = ord($hash[19]) & 0x0F;

        return str_pad((string) (((ord($hash[$offset]) & 0x7F) << 24 | ord($hash[$offset + 1]) << 16 | ord($hash[$offset + 2]) << 8 | ord($hash[$offset + 3])) % 1000000), 6, '0', STR_PAD_LEFT);
    }

    public function test_2fa_user_is_held_at_challenge_until_code_verified(): void
    {
        $user = User::factory()->create(['password' => bcrypt('password')]);
        $this->enable2fa($user);

        $this->from('/login')->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertRedirect('/2fa/challenge');
        $this->assertGuest();

        $this->get('/2fa/challenge')->assertOk();

        $this->from('/2fa/challenge')->post('/2fa/challenge', [
            'code' => $this->totp(self::SECRET),
        ])->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($user);
    }

    public function test_wrong_code_keeps_user_logged_out(): void
    {
        $user = User::factory()->create(['password' => bcrypt('password')]);
        $this->enable2fa($user);

        $this->post('/login', ['email' => $user->email, 'password' => 'password'])
            ->assertRedirect('/2fa/challenge');

        $this->from('/2fa/challenge')->post('/2fa/challenge', ['code' => '000000'])
            ->assertRedirect('/2fa/challenge');
        $this->assertGuest();
    }

    public function test_challenge_without_pending_session_is_rejected(): void
    {
        // No pending session: 403, which the exception handler turns into
        // a guest redirect to login. Either way the page never renders.
        $this->get('/2fa/challenge')->assertRedirect('/login');
        $this->from('/login')->post('/2fa/challenge', ['code' => '123456'])
            ->assertRedirect('/login');
    }

    public function test_user_without_2fa_logs_in_directly(): void
    {
        $user = User::factory()->create(['password' => bcrypt('password')]);

        $this->from('/login')->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($user);
    }
}
