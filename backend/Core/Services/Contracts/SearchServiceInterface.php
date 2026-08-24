<?php

namespace Core\Services\Contracts;

interface SearchServiceInterface
{
    public function query(array $params): array;
    public function index(string $type, string $id, array $data): void;
    public function remove(string $type, string $id): void;
}
