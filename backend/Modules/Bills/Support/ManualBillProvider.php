<?php

namespace Modules\Bills\Support;

/**
 * Off-platform provider (bank transfer, agent, USSD): records the intent
 * and leaves the purchase awaiting confirmation. Never succeeds by itself.
 */
class ManualBillProvider implements BillProviderInterface
{
    public function name(): string
    {
        return 'manual';
    }

    public function vend(array $order): array
    {
        return [
            'provider_reference' => null,
            'status' => 'pending_manual',
            'raw' => ['instructions' => 'Complete this purchase off-platform; an administrator confirms it.'],
        ];
    }
}
