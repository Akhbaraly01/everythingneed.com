<?php

namespace Core\Services\Contracts;

/**
 * Doctor directory reads used across module boundaries
 * (Experts marketplace lists doctors; Healthcare owns them).
 * Implemented by Modules\Healthcare.
 */
interface DoctorQueryInterface
{
    /**
     * @param  array{specialty?: string, available?: bool, per_page?: int}  $filters
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     */
    public function paginateDoctors(array $filters = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator;

    public function findDoctor(string $id): ?object;

    /** Distinct specializations for the expert category directory. */
    public function distinctSpecializations(): array;
}
