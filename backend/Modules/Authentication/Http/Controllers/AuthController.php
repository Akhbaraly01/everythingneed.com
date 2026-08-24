<?php

namespace Modules\Authentication\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Authentication\Services\AuthService;
use Modules\Authentication\Http\Requests\RegisterRequest;
use Modules\Authentication\Http\Requests\LoginRequest;
use Modules\Authentication\Http\Requests\OtpRequest;
use Modules\Authentication\Http\Requests\VerifyOtpRequest;
use Modules\Authentication\Http\Requests\TwoFactorRequest;
use Illuminate\Http\JsonResponse;

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
        $result = $this->authService->login($request->validated());

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
        $this->authService->logout();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
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

    public function enableTwoFactor(TwoFactorRequest $request): JsonResponse
    {
        $result = $this->authService->enableTwoFactor($request->user()->id);

        return response()->json([
            'message' => 'Two-factor authentication enabled',
            'data' => $result,
        ]);
    }

    public function verifyTwoFactor(TwoFactorRequest $request): JsonResponse
    {
        $this->authService->verifyTwoFactor($request->user()->id, $request->code);

        return response()->json([
            'message' => 'Two-factor verification successful',
        ]);
    }

    public function verifyTwoFactorLogin(\Illuminate\Http\Request $request): JsonResponse
    {
        $request->validate([
            'pending_token' => 'required|string',
            'code' => 'required|string|size:6',
        ]);

        $result = app(\Core\Services\AuthService::class)->verifyTwoFactorLogin(
            $request->pending_token,
            $request->code
        );

        return response()->json([
            'message' => 'Login successful',
            'data' => [
                'user' => $this->userWithRole($result['user']),
                'access_token' => $result['token'],
            ],
        ]);
    }
}
