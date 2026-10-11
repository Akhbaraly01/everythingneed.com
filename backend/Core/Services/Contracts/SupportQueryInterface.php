<?php

namespace Core\Services\Contracts;

use Core\DTOs\ScopeContext;

/**
 * Support domain (departments, tickets, support tickets).
 * Implemented by Modules\Messaging.
 */
interface SupportQueryInterface
{
    /** Departments with per-department ticket counts. */
    public function departments(): array;

    /** @return string new department id */
    public function createDepartment(array $data): string;

    /** false when the department does not exist. */
    public function updateDepartment(string $id, array $data): bool;

    /** true when tickets still reference the department. */
    public function departmentInUse(string $id): bool;

    /** false when the department does not exist. */
    public function deleteDepartment(string $id): bool;

    /**
     * @param  array{search?: string, status?: string, page?: int, scope_context?: ScopeContext}  $filters
     * @return array{data: array, total: int}
     */
    public function supportTickets(array $filters = []): array;

    /** No-op on success; returns false when the ticket is missing or outside $scope. */
    public function assignSupportTicket(string $id, string $assignee, ?ScopeContext $scope = null): bool;
}
