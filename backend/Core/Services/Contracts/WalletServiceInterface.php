<?php

namespace Core\Services\Contracts;

interface WalletServiceInterface
{
    public function topUp(string $userId, float $amount, string $reference): object;
    public function debit(string $userId, float $amount, string $reference): object;
    public function transfer(string $fromUserId, string $toUserId, float $amount, string $reference): array;
    public function getBalance(string $userId): float;
}
