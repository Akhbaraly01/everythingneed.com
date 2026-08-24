<?php

namespace Core\Repositories;

interface Repository
{
    public function findById(string $id): ?object;

    public function findMany(array $params = []): object;

    public function create(array $data): object;

    public function update(string $id, array $data): object;

    public function delete(string $id): bool;

    public function exists(string $id): bool;

    public function count(array $filters = []): int;
}
