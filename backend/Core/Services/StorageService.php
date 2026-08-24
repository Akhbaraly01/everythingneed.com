<?php

namespace Core\Services;

use Core\Services\Contracts\StorageServiceInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class StorageService extends BaseService implements StorageServiceInterface
{
    public function upload(string $path, $file, array $options = []): array
    {
        $disk = $options['disk'] ?? config('filesystems.default', 'public');
        $visibility = $options['visibility'] ?? 'public';

        if ($file instanceof UploadedFile) {
            $storedPath = Storage::disk($disk)->putFile($path, $file, $visibility);
        } else {
            $storedPath = Storage::disk($disk)->put($path, $file, $visibility);
        }

        return [
            'path' => $storedPath,
            'url' => Storage::disk($disk)->url($storedPath),
            'size' => Storage::disk($disk)->size($storedPath),
        ];
    }

    public function delete(string $path): void
    {
        $disk = config('filesystems.default', 'public');

        if (Storage::disk($disk)->exists($path)) {
            Storage::disk($disk)->delete($path);
        }
    }

    public function getPublicUrl(string $path): string
    {
        $disk = config('filesystems.default', 'public');

        return Storage::disk($disk)->url($path);
    }
}
