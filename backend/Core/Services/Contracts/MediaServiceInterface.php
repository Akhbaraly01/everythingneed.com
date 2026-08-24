<?php

namespace Core\Services\Contracts;

interface MediaServiceInterface
{
    public function upload(string $path, $file, array $options = []): array;
    public function delete(string $path): void;
    public function getUrl(string $path): string;
}
