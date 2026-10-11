<?php

namespace Modules\Authentication\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Authentication\Services\AuthService;
use Modules\Authentication\Http\Requests\RegisterRequest;
use Modules\Authentication\Http\Requests\LoginRequest;
use Modules\Authentication\Http\Requests\OtpRequest;
use Modules\Authentication\Http\Requests\VerifyOtpRequest;
use Modules\Authentication\Http\Requests\EmailOtpRequest;
use Modules\Authentication\Http\Requests\VerifyEmailOtpRequest;
use Modules\Authentication\Http\Requests\TwoFactorRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(
        private AuthService $authService
    ) {}

    private function userWithRole($user): array
    {
        $role = $user->roles()->orderBy('created_at')->value('role') ?? 'user';
        $profile = $user->profile;

        return [
            'id' => $user->id,
            'email' => $user->email,
            'name' => $user->name,
            'role' => $role,
            'profile' => $profile ? [
                'id' => $profile->id,
                'email' => $profile->email,
                'full_name' => $profile->full_name,
                'phone' => $profile->phone,
                'avatar_url' => $profile->avatar_url,
            ] : null,
        ];
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        $result = $this->authService->register($request->validated());

        return response()->json([
            'message' => 'Registration successful',
            'data' => [
                'user' => $this->userWithRole($result['user']),
                'access_token' => $result['token'],
            ],
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        try {
            $result = $this->authService->login($request->validated());
        } catch (\Throwable $e) {
            $this->auditAuth('auth.login_failed', null, [
                'email'  => (string) ($request->validated()['email'] ?? ''),
                'reason' => 'credentials',
            ]);
            throw $e;
        }

        if (!empty($result['requires_2fa'])) {
            return response()->json([
                'message' => 'Two-factor authentication required',
                'data' => [
                    'requires_2fa' => true,
                    'pending_token' => $result['pending_token'],
                ],
            ]);
        }

        $this->auditAuth('auth.login', $result['user']->id, [
            'email' => $result['user']->email,
            'guard' => 'api',
        ]);

        return response()->json([
            'message' => 'Login successful',
            'data' => [
                'user' => $this->userWithRole($result['user']),
                'access_token' => $result['token'],
            ],
        ]);
    }

    public function session(): JsonResponse
    {
        $user = auth()->user();

        if (!$user) {
            return response()->json(['data' => ['session' => null]]);
        }

        return response()->json([
            'data' => [
                'session' => [
                    'user' => $this->userWithRole($user),
                    'access_token' => request()->bearerToken(),
                ],
            ],
        ]);
    }

    public function logout(): JsonResponse
    {
        $userId = auth('sanctum')->id() ?? auth()->id();

        $this->authService->logout();

        $this->auditAuth('auth.logout', is_string($userId) ? $userId : null, ['guard' => 'api']);

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    /**
     * Active sessions (API tokens) for the Sessions page. The token used
     * for this request is flagged so the UI never offers to kill it
     * silently - revoking it signs this device out.
     */
    public function tokens(Request $request): JsonResponse
    {
        $user = $request->user();
        $current = $user->currentAccessToken();

        $tokens = $user->tokens()->orderByDesc('last_used_at')->orderByDesc('created_at')->get()->map(fn ($t) => [
            'id' => $t->id,
            'name' => $t->name,
            'last_used_at' => $t->last_used_at,
            'created_at' => $t->created_at,
            'current' => $current ? ((int) $t->id === (int) $current->id) : false,
        ]);

        return response()->json(['data' => $tokens]);
    }

    public function revokeToken(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $token = $user->tokens()->where('id', $id)->first();

        if (! $token) {
            return response()->json(['message' => 'Session not found'], 404);
        }

        $current = $user->currentAccessToken();
        $isCurrent = $current && (int) $token->id === (int) $current->id;
        $token->delete();

        $this->auditAuth('auth.session.revoked', (string) $user->id, []);

        return response()->json([
            'message' => $isCurrent ? 'Signed out on this device.' : 'Session revoked.',
        ]);
    }

    public function revokeOtherTokens(Request $request): JsonResponse
    {
        $user = $request->user();
        $current = $user->currentAccessToken();

        $query = $user->tokens();
        if ($current) {
            $query->where('id', '!=', $current->id);
        }
        $count = $query->count();
        $query->delete();

        $this->auditAuth('auth.session.revoked_others', (string) $user->id, ['count' => $count]);

        return response()->json(['message' => "Revoked {$count} other session(s)."]);
    }

    /** Best-effort auth audit (spec §66); never blocks the auth flow. */
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

    public function user(): JsonResponse
    {
        $user = $this->authService->user();

        if (!$user) {
            return response()->json([
                'data' => [
                    'user' => null,
                ],
            ]);
        }

        return response()->json([
            'data' => [
                'user' => $this->userWithRole($user),
            ],
        ]);
    }

    public function requestOtp(OtpRequest $request): JsonResponse
    {
        $result = $this->authService->requestOtp($request->phone);

        return response()->json([
            'message' => 'OTP sent successfully',
            'data' => $result,
        ]);
    }

    public function verifyOtp(VerifyOtpRequest $request): JsonResponse
    {
        $this->authService->verifyOtp($request->phone, $request->code);

        return response()->json([
            'message' => 'OTP verified successfully',
        ]);
    }

    public function requestEmailOtp(EmailOtpRequest $request): JsonResponse
    {
        $result = $this->authService->requestEmailOtp($request->email);

        return response()->json([
            'message' => 'OTP sent successfully',
            'data' => $result,
        ]);
    }

    public function verifyEmailOtp(VerifyEmailOtpRequest $request): JsonResponse
    {
        $this->authService->verifyEmailOtp($request->email, $request->code);

        return response()->json([
            'message' => 'OTP verified successfully',
        ]);
    }

    public function enableTwoFactor(\Illuminate\Http\Request $request): JsonResponse
    {
        $result = $this->authService->enableTwoFactor($request->user()->id);

        return response()->json([
            'message' => 'Two-factor authentication enabled',
            'data' => $result,
        ]);
    }

    public function verifyTwoFactor(TwoFactorRequest $request): JsonResponse
    {
        $valid = $this->authService->verifyTwoFactor($request->user()->id, $request->code);

        if (!$valid) {
            return response()->json([
                'message' => 'Invalid two-factor code',
            ], 422);
        }

        return response()->json([
            'message' => 'Two-factor verification successful',
        ]);
    }

    public function disableTwoFactor(\Illuminate\Http\Request $request): JsonResponse
    {
        $this->authService->disableTwoFactor($request->user()->id);

        return response()->json([
            'message' => 'Two-factor authentication disabled',
        ]);
    }

    public function verifyTwoFactorLogin(\Illuminate\Http\Request $request): JsonResponse
    {
        $request->validate([
            'pending_token' => 'required|string',
            'code' => 'required|string|size:6',
        ]);

        try {
            $result = app(\Core\Services\AuthService::class)->verifyTwoFactorLogin(
                $request->pending_token,
                $request->code
            );
        } catch (\InvalidArgumentException $e) {
            // Wrong code / expired or already-used pending token: a user
            // mistake must be a 422, never an unhandled 500.
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Login successful',
            'data' => [
                'user' => $this->userWithRole($result['user']),
                'access_token' => $result['token'],
            ],
        ]);
    }
}
