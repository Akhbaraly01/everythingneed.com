<?php

namespace Core\Services\Contracts;

interface PaymentGatewayInterface
{
    public function charge(array $data): array;
    public function refund(array $data): array;
    public function getPayment(string $id): ?object;
    public function attachMethod(string $userId, array $methodData): array;
}
