<?php

namespace Core\Services\Contracts;

/**
 * Vendor-facing queries/commands consumed across module boundaries
 * (admin console, finance payouts). Implemented by Modules\Vendors.
 */
interface VendorQueryInterface
{
    /**
     * @param  array{search?: string, status?: string, per_page?: int, page?: int}  $filters
     * @return array{data: array, meta: array{total: int, page: int, per_page: int}}
     */
    public function paginate(array $filters = []): array;

    public function find(string $id): ?object;

    /**
     * Flip verification state. Returns false when the vendor is missing.
     * $action is the audit action (approve|update); $details replaces the
     * audited payload with a human-readable note when provided.
     */
    public function setVerified(string $id, bool $verified, string $action = 'update', ?string $details = null): bool;

    /**
     * @param  array{status?: string, page?: int}  $filters
     * @return array{data: array, total: int}
     */
    public function withdrawals(array $filters = []): array;

    public function findWithdrawal(string $id): ?object;

    /** Mark a pending withdrawal as paid. */
    public function markWithdrawalPaid(string $id): void;

    /**
     * Idempotent commission accrual for a delivered vendor order
     * (vendor keeps 90%, platform fee 10%).
     */
    public function recordCommission(string $vendorId, string $orderId, float $totalPrice): void;
}
