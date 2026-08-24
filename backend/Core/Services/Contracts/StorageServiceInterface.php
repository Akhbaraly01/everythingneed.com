<?php

namespace Core\Services\Contracts;

interface StorageServiceInterface
{
    public function upload(string $path, $file, array $options = []): array;
    public function delete(string $path): void;
    public function getPublicUrl(string $path): string;
}
