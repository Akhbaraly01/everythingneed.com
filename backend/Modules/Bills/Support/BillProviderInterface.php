<?php

namespace Modules\Bills\Support;

/**
 * Bill vending provider contract (spec 30). Providers vend utility value
 * against account fields; they never touch the wallet ledger - money
 * movement is the orchestrator's job.
 */
interface BillProviderInterface
{
    public function name(): string;

    /**
     * @return array{provider_reference?: string, status: string, raw?: mixed}
     *
     * @throws \RuntimeException when the vend fails or the provider is
     *                          unconfigured. Never return success for those.
     */
    public function vend(array $order): array;
}
