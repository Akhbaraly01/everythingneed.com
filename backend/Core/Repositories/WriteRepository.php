<?php

namespace Core\Repositories;

interface WriteRepository
{
    public function create(array $data): object;

    public function update(string $id, array $data): object;

    public function delete(string $id): bool;
}
