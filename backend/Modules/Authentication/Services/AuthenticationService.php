<?php
namespace Modules\Authentication\Services;

use Core\Services\BaseService;
use Core\Services\Contracts\AuthServiceInterface;

class AuthenticationService extends BaseService implements AuthServiceInterface
{
    public function register(array $data): array { return []; }
    public function login(array $credentials): array { return []; }
    public function logout(string $userId): void {}
    public function requestOtp(string $identifier): array { return []; }
    public function verifyOtp(string $identifier, string $code): array { return []; }
    public function enableTwoFactor(string $userId): array { return []; }
    public function verifyTwoFactor(string $userId, string $code): bool { return false; }
    public function refresh(string $refreshToken): array { return []; }
    public function getUser(string $userId): ?array { return null; }
}