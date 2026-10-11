<?php

namespace Core\Services\Gateways;

interface GatewayDriverInterface
{
    public function name(): string;

    /**
     * @return array{transaction_id?:string,status:string,raw?:array}
     * @throws \RuntimeException
     */
    public function charge(array $data): array;

    /**
     * @return array{refund_id?:string,status:string,raw?:array}
     * @throws \RuntimeException
     */
    public function refund(array $payment, float $amount, array $context = []): array;
}
