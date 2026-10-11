<?php

namespace Core\Services\Contracts;

use App\Models\ApprovalRequest;
use App\Models\User;

/**
 * Generic approval engine (W4): multi-step approval requests with
 * per-step role gates, phaseable onto future flows. Stronger specialized
 * flows (KYC review, product approval) stay on their own contracts until
 * a migration phase deliberately moves them here.
 *
 * Implemented by Core\Services\ApprovalEngine.
 */
interface ApprovalEngineInterface
{
    /**
     * Create a pending request with an ordered step chain.
     *
     * @param  list<string|null>  $approverRoles  one entry per step; null = any permitted approver
     */
    public function request(
        string $type,
        string $title,
        array $approverRoles,
        ?string $subjectType = null,
        ?string $subjectId = null,
        ?array $payload = null,
        ?string $requestedBy = null,
    ): ApprovalRequest;

    /**
     * Decide the current step: approve advances (or finalizes), reject
     * terminates the request and skips the remaining steps.
     *
     * @return string ok | missing | forbidden | already_decided
     */
    public function decide(User $actor, string $requestId, bool $approve, ?string $comment = null): string;

    /**
     * @param  array{status?: string, type?: string, page?: int, per_page?: int}  $filters
     * @return array{data: array, meta: array{total: int, page: int, per_page: int}}
     */
    public function list(array $filters = []): array;

    public function find(string $id): ?ApprovalRequest;
}
