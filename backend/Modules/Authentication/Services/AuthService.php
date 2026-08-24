<?php

namespace Modules\Authentication\Services;

use Core\Services\Contracts\AuthServiceInterface;
use Modules\Authentication\Actions\RegisterUser;
use Modules\Authentication\Actions\LoginUser;
use Modules\Authentication\Actions\LogoutUser;
use Modules\Authentication\Actions\RequestOtp;
use Modules\Authentication\Actions\VerifyOtp;
use Modules\Authentication\Actions\EnableTwoFactor;
use Modules\Authentication\Actions\VerifyTwoFactor;

class AuthService implements AuthServiceInterface
{
    public function __construct(
        private RegisterUser $registerUser,
        private LoginUser $loginUser,
        private LogoutUser $logoutUser,
        private RequestOtp $requestOtp,
        private VerifyOtp $verifyOtp,
        private EnableTwoFactor $enableTwoFactor,
        private VerifyTwoFactor $verifyTwoFactor,
    ) {}

    public function register(array $data): array
    {
        return $this->registerUser->execute($data);
    }

    public function login(array $credentials): array
    {
        return $this->loginUser->execute($credentials);
    }

    public function logout(): void
    {
        $this->logoutUser->execute();
    }

    public function user(): ?object
    {
        return auth()->user();
    }

    public function requestOtp(string $phone): array
    {
        return $this->requestOtp->execute($phone);
    }

    public function verifyOtp(string $phone, string $code): bool
    {
        return $this->verifyOtp->execute($phone, $code);
    }

    public function enableTwoFactor(string $userId): array
    {
        return $this->enableTwoFactor->execute($userId);
    }

    public function verifyTwoFactor(string $userId, string $code): bool
    {
        return $this->verifyTwoFactor->execute($userId, $code);
    }
}
