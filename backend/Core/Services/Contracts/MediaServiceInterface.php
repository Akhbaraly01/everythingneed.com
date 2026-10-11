<?php

namespace Core\Services\Contracts;

interface MediaServiceInterface
{
    public function upload(string $path, $file, array $options = []): array;
    public function delete(string $path, ?string $disk = null): void;
    public function getUrl(string $path, ?string $disk = null): string;
}
