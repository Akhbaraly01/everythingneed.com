<?php

namespace Core\Repositories;

interface ReadRepository
{
    public function findById(string $id): ?object;

    public function findMany(array $params = []): object;

    public function exists(string $id): bool;

    public function count(array $filters = []): int;
}
