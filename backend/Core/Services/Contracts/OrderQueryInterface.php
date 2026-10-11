<?php

namespace Core\Services\Contracts;

use Core\DTOs\ScopeContext;

/**
 * Vendor-order administration across module boundaries.
 * Implemented by Modules\Orders.
 *
 * Every read/write accepts an optional resolved ScopeContext (W1.6) —
 * callers pass it so narrowed roles only see/mutate rows inside their scope;
 * null means global (unscoped).
 */
interface OrderQueryInterface
{
    /**
     * @param  array{search?: string, status?: string, vendor_id?: string, date_from?: string, date_to?: string, per_page?: int, page?: int, scope_context?: ScopeContext}  $filters
     * @return array{data: array, meta: array{total: int, page: int, per_page: int}}
     */
    public function paginate(array $filters = []): array;

    public function find(string $id, ?ScopeContext $scope = null): ?object;

    /**
     * Status transition guarded by the order state machine (W4).
     *
     * @return string ok | missing | invalid_transition
     */
    public function updateStatus(string $id, string $status, ?string $reason = null, ?ScopeContext $scope = null): string;

    /**
     * Issue a refund (status → refunded); blocked for terminal states.
     *
     * @return string ok | missing | already_refunded | not_refundable
     */
    public function refund(string $id, ?string $reason = null, ?ScopeContext $scope = null): string;
}
