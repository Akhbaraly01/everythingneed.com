<?php

namespace Core\Services;

use Core\Services\Contracts\MediaServiceInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManagerStatic as Image;

class MediaService extends BaseService implements MediaServiceInterface
{
    public function upload(string $path, $file, array $options = []): array
    {
        $disk = $options['disk'] ?? config('filesystems.default', 'public');
        $visibility = $options['visibility'] ?? 'public';
        $maxWidth = $options['max_width'] ?? null;
        $maxHeight = $options['max_height'] ?? null;
        $quality = $options['quality'] ?? 85;

        if ($file instanceof UploadedFile) {
            if ($maxWidth || $maxHeight && $this->isImage($file->getMimeType())) {
                $processed = Image::make($file);
                if ($maxWidth) {
                    $processed->resize($maxWidth, null, fn($constraint) => $constraint->aspectRatio());
                }
                if ($maxHeight) {
                    $processed->resize(null, $maxHeight, fn($constraint) => $constraint->aspectRatio());
                }
                $processed->encode($file->getClientOriginalExtension(), $quality);

                $storedPath = Storage::disk($disk)->put($path, $processed->getEncoded(), $visibility);
            } else {
                $storedPath = Storage::disk($disk)->putFile($path, $file, $visibility);
            }
        } else {
            $storedPath = Storage::disk($disk)->put($path, $file, $visibility);
        }

        return [
            'path' => $storedPath,
            'url' => Storage::disk($disk)->url($storedPath),
            'size' => Storage::disk($disk)->size($storedPath),
            'mime_type' => Storage::disk($disk)->mimeType($storedPath),
        ];
    }

    public function delete(string $path): void
    {
        $disk = config('filesystems.default', 'public');

        if (Storage::disk($disk)->exists($path)) {
            Storage::disk($disk)->delete($path);
        }
    }

    public function getUrl(string $path): string
    {
        $disk = config('filesystems.default', 'public');

        return Storage::disk($disk)->url($path);
    }

    private function isImage(string $mimeType): bool
    {
        return str_starts_with($mimeType, 'image/');
    }
}
