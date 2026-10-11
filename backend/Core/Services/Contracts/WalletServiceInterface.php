<?php

namespace Core\Services\Contracts;

interface WalletServiceInterface
{
    public function topUp(string $userId, float $amount, string $reference, ?string $description = null): object;
    public function debit(string $userId, float $amount, string $reference, ?string $description = null): object;
    public function transfer(string $fromUserId, string $toUserId, float $amount, string $reference): array;
    public function getBalance(string $userId): float;
    public function getAvailableBalance(string $userId): float;
    public function hold(string $userId, float $amount, string $reference, ?string $reason = null, ?string $orderId = null, ?\DateTimeInterface $expiresAt = null): object;
    public function releaseHold(string $userId, string $reference): object;
    public function captureHold(string $userId, string $reference): array;
    public function listHolds(string $userId, int $page = 1, int $perPage = 15): object;
}
