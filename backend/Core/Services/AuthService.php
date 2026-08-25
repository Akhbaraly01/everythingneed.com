<?php

namespace Core\Services;

use App\Models\User;
use Core\Services\Contracts\AuthServiceInterface;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Modules\Authentication\Entities\OtpChallenge;
use Modules\Authentication\Entities\TwoFactorSecret;
use Modules\Authentication\Entities\Session;

class AuthService extends BaseService implements AuthServiceInterface
{
    public function register(array $data): array
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'password' => Hash::make($data['password']),
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
        ];
    }

    public function login(array $credentials): array
    {
        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            throw new \InvalidArgumentException('Invalid credentials.');
        }

        // Suspended accounts are locked out of new sessions entirely.
        if ($user->suspended_at) {
            throw new \Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException(
                'This account has been suspended. Contact support for assistance.'
            );
        }

        if ($user->twoFactorSecret && $user->twoFactorSecret->enabled) {
            $pendingToken = Str::random(60);
            cache()->put("2fa_pending:{$pendingToken}", $user->id, 300);

            return [
                'requires_2fa' => true,
                'pending_token' => $pendingToken,
            ];
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
        ];
    }

    public function logout(): void
    {
        Auth::user()->currentAccessToken()->delete();
    }

    public function user(): ?object
    {
        $user = Auth::user();

        if (!$user) {
            return null;
        }

        return (object) [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'roles' => $user->roles->pluck('role')->toArray(),
        ];
    }

    public function requestOtp(string $phone): array
    {
        $user = User::where('phone', $phone)->first();

        if (!$user) {
            throw new \InvalidArgumentException('User not found with this phone number.');
        }

        OtpChallenge::where('phone', $phone)->where('verified', false)->delete();

        $code = str_pad(random_int(100000, 999999), 6, '0', STR_PAD_LEFT);

        $challenge = OtpChallenge::create([
            'user_id' => $user->id,
            'phone' => $phone,
            'code' => Hash::make($code),
            'expires_at' => now()->addMinutes(10),
            'attempts' => 0,
            'verified' => false,
        ]);

        // TODO: dispatch SMS notification job
        // SendSmsJob::dispatch($phone, "Your verification code is: {$code}");

        return [
            'challenge_id' => $challenge->id,
            'expires_at' => $challenge->expires_at->toIso8601String(),
        ];
    }

    public function verifyOtp(string $phone, string $code): bool
    {
        $challenge = OtpChallenge::where('phone', $phone)
            ->where('verified', false)
            ->latest()
            ->first();

        if (!$challenge) {
            throw new \InvalidArgumentException('No active OTP challenge found.');
        }

        if ($challenge->isExpired()) {
            throw new \InvalidArgumentException('OTP has expired.');
        }

        if ($challenge->isMaxAttemptsReached()) {
            throw new \InvalidArgumentException('Maximum attempts reached.');
        }

        $challenge->increment('attempts');

        if (!Hash::check($code, $challenge->code)) {
            return false;
        }

        $challenge->update(['verified' => true]);
        $user = $challenge->user;
        $user->update(['email_verified_at' => now()]);

        return true;
    }

    public function enableTwoFactor(string $userId): array
    {
        $user = User::findOrFail($userId);

        $secret = TwoFactorSecret::updateOrCreate(
            ['user_id' => $userId],
            [
                'secret' => Str::random(32),
                'enabled' => false,
            ]
        );

        return [
            'secret' => $secret->secret,
            'qr_code_url' => $this->generateQrUrl($user, $secret->secret),
        ];
    }

    public function verifyTwoFactor(string $userId, string $code): bool
    {
        $secret = TwoFactorSecret::where('user_id', $userId)->first();

        if (!$secret) {
            throw new \InvalidArgumentException('Two-factor not initialized.');
        }

        // Time-based TOTP verification (30-second window, ±1 step tolerance)
        $valid = $this->verifyTotp($secret->secret, $code);

        if ($valid) {
            $secret->update([
                'enabled' => true,
                'verified_at' => now(),
            ]);
        }

        return $valid;
    }

    public function verifyTwoFactorLogin(string $pendingToken, string $code): array
    {
        $userId = cache()->pull("2fa_pending:{$pendingToken}");

        if (!$userId) {
            throw new \InvalidArgumentException('Invalid or expired 2FA session.');
        }

        $secret = TwoFactorSecret::where('user_id', $userId)->where('enabled', true)->first();

        if (!$secret) {
            throw new \InvalidArgumentException('Two-factor not enabled for this user.');
        }

        if (!$this->verifyTotp($secret->secret, $code)) {
            throw new \InvalidArgumentException('Invalid 2FA code.');
        }

        $user = User::findOrFail($userId);
        $token = $user->createToken('auth-token')->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
        ];
    }

    private function verifyTotp(string $secret, string $code): bool
    {
        $key = base32Decode($secret);
        $time = floor(time() / 30);

        // Check current window and ±1 for clock drift
        for ($i = -1; $i <= 1; $i++) {
            $counter = pack('N*', 0) . pack('N*', (int) ($time + $i));
            $hash = hash_hmac('sha1', $counter, $key, true);
            $offset = ord($hash[19]) & 0xf;
            $otp = (
                ((ord($hash[$offset]) & 0x7f) << 24) |
                ((ord($hash[$offset + 1]) & 0xff) << 16) |
                ((ord($hash[$offset + 2]) & 0xff) << 8) |
                (ord($hash[$offset + 3]) & 0xff)
            ) % 1000000;

            if (hash_equals(str_pad((string) $otp, 6, '0', STR_PAD_LEFT), $code)) {
                return true;
            }
        }

        return false;
    }

    private function generateQrUrl(User $user, string $secret): string
    {
        $otpauth = sprintf(
            'otpauth://totp/%s:%s?secret=%s&issuer=%s',
            urlencode(config('app.name')),
            urlencode($user->email),
            $secret,
            urlencode(config('app.name'))
        );

        return 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' . urlencode($otpauth);
    }

    public function disableTwoFactor(string $userId): bool
    {
        $secret = TwoFactorSecret::where('user_id', $userId)->first();

        if (!$secret) {
            throw new \InvalidArgumentException('Two-factor not configured.');
        }

        $secret->update(['enabled' => false]);

        return true;
    }
}

function base32Decode(string $input): string
{
    $map = [
        'A' => 0, 'B' => 1, 'C' => 2, 'D' => 3, 'E' => 4, 'F' => 5,
        'G' => 6, 'H' => 7, 'I' => 8, 'J' => 9, 'K' => 10, 'L' => 11,
        'M' => 12, 'N' => 13, 'O' => 14, 'P' => 15, 'Q' => 16, 'R' => 17,
        'S' => 18, 'T' => 19, 'U' => 20, 'V' => 21, 'W' => 22, 'X' => 23,
        'Y' => 24, 'Z' => 25, '2' => 26, '3' => 27, '4' => 28, '5' => 29,
        '6' => 30, '7' => 31,
    ];

    $input = strtoupper(rtrim($input, '='));
    $buffer = 0;
    $bitsLeft = 0;
    $output = '';

    for ($i = 0; $i < strlen($input); $i++) {
        $val = $map[$input[$i]] ?? -1;
        if ($val < 0) {
            continue;
        }
        $buffer = ($buffer << 5) | $val;
        $bitsLeft += 5;
        if ($bitsLeft >= 8) {
            $bitsLeft -= 8;
            $output .= chr(($buffer >> $bitsLeft) & 0xff);
        }
    }

    return $output;
}
