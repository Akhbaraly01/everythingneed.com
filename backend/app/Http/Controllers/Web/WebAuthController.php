<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Requests\WebForgotPasswordRequest;
use App\Http\Requests\WebLoginRequest;
use App\Http\Requests\WebRegisterRequest;
use App\Http\Requests\WebResetPasswordRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\User;
use Illuminate\Support\Facades\Password;

class WebAuthController extends Controller
{
    public function showLogin(): Response
    {
        return Inertia::render('auth/Login');
    }

    public function login(WebLoginRequest $request): RedirectResponse
    {
        $credentials = $request->validated();

        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            $this->auditAuth('auth.login_failed', null, ['email' => $credentials['email'], 'reason' => 'credentials']);
            throw ValidationException::withMessages([
                'email' => __('These credentials do not match our records.'),
            ]);
        }

        if ($user->suspended_at) {
            $this->auditAuth('auth.login_failed', $user->id, ['email' => $credentials['email'], 'reason' => 'suspended']);
            return redirect()->to('/suspended?email='.urlencode($credentials['email']));
        }

        // Authenticator-app 2FA is enforced on the web guard too: no session
        // until the TOTP challenge succeeds (previously web login skipped it).
        if ($user->twoFactorSecret && $user->twoFactorSecret->enabled) {
            $pendingToken = \Illuminate\Support\Str::random(60);
            cache()->put("2fa_pending:{$pendingToken}", $user->id, 300);
            $request->session()->put('2fa_pending', $pendingToken);

            return redirect()->to('/2fa/challenge');
        }

        Auth::login($user, $request->boolean('remember'));
        $request->session()->regenerate();

        $this->auditAuth('auth.login', $user->id, ['email' => $user->email, 'guard' => 'web']);

        return redirect()->intended($this->landingFor($user));
    }

    public function showChallenge(): \Inertia\Response
    {
        abort_unless(session()->has('2fa_pending'), 403, 'No pending two-factor session.');

        return \Inertia\Inertia::render('auth/TwoFactorChallenge');
    }

    public function challenge(Request $request): RedirectResponse
    {
        $pendingToken = (string) $request->session()->get('2fa_pending', '');
        $code = (string) $request->input('code', '');

        if ($pendingToken === '' || $code === '') {
            return redirect()->to('/login')->withErrors(['email' => 'Two-factor session expired. Sign in again.']);
        }

        try {
            $result = app(\Core\Services\AuthService::class)->verifyTwoFactorLogin($pendingToken, $code);
        } catch (\Throwable $e) {
            return redirect()->to('/2fa/challenge')->withErrors(['code' => 'Invalid code. Try again.']);
        }

        $request->session()->forget('2fa_pending');
        Auth::login($result['user'], true);
        $request->session()->regenerate();

        $this->auditAuth('auth.login', $result['user']->id, ['email' => $result['user']->email, 'guard' => 'web-2fa']);

        return redirect()->intended($this->landingFor($result['user']));
    }

    public function showRegister(): Response
    {
        return Inertia::render('auth/Register');
    }

    public function register(WebRegisterRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        // Paused verification mail (MAIL_ENABLED=false): auto-verify so new
        // accounts can log in and test immediately.
        if (!config('verification.mail_enabled', true)) {
            $user->markEmailAsVerified();
        }

        \App\Models\UserRole::firstOrCreate([
            'user_id' => $user->id,
            'role' => 'user',
        ]);

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->to($this->landingFor($user));
    }

    public function logout(Request $request): RedirectResponse
    {
        $userId = Auth::guard('web')->id();

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        $this->auditAuth('auth.logout', is_string($userId) ? $userId : null, ['guard' => 'web']);

        return redirect()->route('login');
    }

    public function sendResetLink(WebForgotPasswordRequest $request): RedirectResponse
    {
        $status = Password::sendResetLink(
            $request->only('email')
        );

        return $status === Password::RESET_LINK_SENT
            ? back()->with('status', __($status))
            : back()->withErrors(['email' => __($status)]);
    }

    public function resetPassword(WebResetPasswordRequest $request): RedirectResponse
    {
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                ])->save();

                // A password change invalidates every live API session
                // (mirrors AuthService::confirm behaviour).
                $user->tokens()->delete();
            }
        );

        return $status === Password::PASSWORD_RESET
            ? redirect()->route('login')->with('status', __($status))
            : back()->withErrors(['email' => [__($status)]]);
    }

    /**
     * Best-effort auth audit (spec §66: login/logout recorded). Failures
     * never break the auth flow itself.
     */
    private function auditAuth(string $action, ?string $userId, array $context): void
    {
        try {
            app(\Core\Services\Contracts\AuditServiceInterface::class)->log([
                'action'       => $action,
                'entity_type'  => 'auth',
                'entity_id'    => $userId ?? (string) ($context['email'] ?? 'unknown'),
                'performed_by' => $userId,
                'new_values'   => $context,
            ]);
        } catch (\Throwable) {
            // Audit failures must not block authentication.
        }
    }

    /**
     * Role-aware post-login destination (workspace resolver): admins land on
     * their console, vendors on the portal, workers on the provider console,
     * everyone else on the marketplace dashboard.
     */
    private function landingFor(User $user): string
    {
        return app(\Core\Services\Contracts\WorkspaceResolverInterface::class)->landingPath($user);
    }
}
