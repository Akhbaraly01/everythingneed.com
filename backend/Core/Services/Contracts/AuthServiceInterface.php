<?php

namespace Core\Services\Contracts;

interface AuthServiceInterface
{
    public function register(array $data): array;
    public function login(array $credentials): array;
    public function logout(): void;
    public function user(): ?object;
    public function requestOtp(string $phone): array;
    public function verifyOtp(string $phone, string $code): bool;
    public function enableTwoFactor(string $userId): array;
    public function verifyTwoFactor(string $userId, string $code): bool;
}
