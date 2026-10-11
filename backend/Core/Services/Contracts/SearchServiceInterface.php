<?php

namespace Core\Services\Contracts;

interface SearchServiceInterface
{
    public function query(array $params): array;
    public function index(string $type, string $id, array $data): void;
    public function remove(string $type, string $id): void;

    /**
     * Cross-domain keyword discovery used by the public search endpoint.
     * type ∈ {all, products, services, courses, restaurants, hotels, jobs}.
     *
     * @return array<string, array> grouped result rows keyed by domain
     */
    public function discover(string $term, string $type): array;
}
