<?php

namespace Core\Services;

use Core\Services\Contracts\MediaServiceInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Media pipeline on native GD (W1).
 *
 * The previous revision imported intervention/image via ImageManagerStatic,
 * a package that is not installed - every resize call fataled. GD ships
 * with PHP and covers the catalogue's needs (jpeg/png/webp resize with
 * aspect ratio + quality; everything else stored untouched).
 */
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
            // NOTE: the old code read `$maxWidth || $maxHeight && isImage(...)`
            // (&& binds tighter) - a lone max_width would resize PDFs. Fixed.
            $mime = $file->getMimeType() ?: '';
            $isSvg = $mime === 'image/svg+xml'
                || strtolower($file->getClientOriginalExtension()) === 'svg';
            if ($isSvg) {
                // Spec 44: SVGs are sanitized before they ever reach disk.
                $storedPath = $this->storeSanitizedSvg($disk, $path, $file, $visibility);
            } elseif (($maxWidth || $maxHeight) && $this->isResizableRaster($mime)) {
                $storedPath = $this->storeResized(
                    $disk, $path, $file, $maxWidth, $maxHeight, $quality, $visibility
                );
                if ($storedPath === null) {
                    $storedPath = Storage::disk($disk)->putFile($path, $file, $visibility);
                }
            } else {
                $storedPath = Storage::disk($disk)->putFile($path, $file, $visibility);
            }
        } else {
            $contents = $file;
            if (strtolower(pathinfo($path, PATHINFO_EXTENSION)) === 'svg') {
                $clean = app(SvgSanitizer::class)->sanitize($contents);
                if ($clean === null) {
                    throw new \Core\Exceptions\ValidationException('The SVG file was rejected: it could not be sanitized.');
                }
                $contents = $clean;
            }
            $ok = Storage::disk($disk)->put($path, $contents, $visibility);
            if (! $ok) {
                throw new \RuntimeException("MediaService: failed to store [{$path}] on disk [{$disk}].");
            }
            $storedPath = $path;
        }

        return [
            'path' => $storedPath,
            'url' => Storage::disk($disk)->url($storedPath),
            'size' => Storage::disk($disk)->size($storedPath),
            'mime_type' => Storage::disk($disk)->mimeType($storedPath),
        ];
    }

    /**
     * @param string|null $disk Disk the file lives on; defaults to the app
     *                          default disk. Callers that stored with an
     *                          explicit disk (e.g. the media library) must
     *                          pass it back here.
     */
    public function delete(string $path, ?string $disk = null): void
    {
        $disk = $disk ?? config('filesystems.default', 'public');

        if (Storage::disk($disk)->exists($path)) {
            Storage::disk($disk)->delete($path);
        }
    }

    public function getUrl(string $path, ?string $disk = null): string
    {
        $disk = $disk ?? config('filesystems.default', 'public');

        return Storage::disk($disk)->url($path);
    }

    /**
     * Raster formats GD can safely decode + re-encode. GIF passes through
     * untouched (GD would destroy animation); SVG/BMP are not GD rasters.
     */
    private function isResizableRaster(string $mimeType): bool
    {
        return in_array($mimeType, ['image/jpeg', 'image/png', 'image/webp'], true);
    }

    /**
     * Spec 44: sanitize SVG markup, then store the cleaned bytes under a
     * random name. Rejects (ValidationException) when sanitization fails -
     * an unsafe SVG never reaches the public disk.
     */
    private function storeSanitizedSvg(string $disk, string $path, UploadedFile $file, string $visibility): string
    {
        $raw = @file_get_contents($file->getRealPath());
        $clean = $raw === false ? null : app(SvgSanitizer::class)->sanitize($raw);
        if ($clean === null) {
            throw new \Core\Exceptions\ValidationException('The SVG file was rejected: it could not be sanitized.');
        }

        $storedPath = trim($path, '/').'/'.Str::random(40).'.svg';
        Storage::disk($disk)->put($storedPath, $clean, $visibility);

        return $storedPath;
    }

    /**
     * Fit the image inside the max box (aspect preserved, never upscale),
     * re-encode with GD and store the bytes. Returns the stored path, or
     * null when GD cannot decode the file (caller falls back to putFile).
     */
    private function storeResized(
        string $disk,
        string $path,
        UploadedFile $file,
        mixed $maxWidth,
        mixed $maxHeight,
        int $quality,
        string $visibility
    ): ?string {
        $contents = @file_get_contents($file->getRealPath());
        if ($contents === false) {
            return null;
        }

        $src = @imagecreatefromstring($contents);
        if ($src === false) {
            return null;
        }

        $origW = imagesx($src);
        $origH = imagesy($src);
        if ($origW <= 0 || $origH <= 0) {
            imagedestroy($src);

            return null;
        }

        [$targetW, $targetH] = $this->fitInside($origW, $origH, (int) $maxWidth, (int) $maxHeight);

        if ($targetW !== $origW || $targetH !== $origH) {
            $resized = imagescale($src, $targetW, $targetH);
            imagedestroy($src);
            if ($resized === false) {
                return null;
            }
            $src = $resized;
        }

        $mime = $file->getMimeType() ?: 'image/jpeg';
        $encoded = $this->encodeRaster($src, $mime, $quality);
        imagedestroy($src);

        if ($encoded === null) {
            return null;
        }

        $ext = strtolower($file->getClientOriginalExtension() ?: 'jpg');
        $filename = Str::random(40).'.'.$ext;
        $storedPath = trim($path, '/').'/'.$filename;

        Storage::disk($disk)->put($storedPath, $encoded, $visibility);

        return $storedPath;
    }

    /**
     * @return array{0:int,1:int}
     */
    private function fitInside(int $w, int $h, int $maxW, int $maxH): array
    {
        $scale = 1.0;
        if ($maxW > 0 && $w > $maxW) {
            $scale = min($scale, $maxW / $w);
        }
        if ($maxH > 0 && $h > $maxH) {
            $scale = min($scale, $maxH / $h);
        }

        return [(int) round($w * $scale), (int) round($h * $scale)];
    }

    private function encodeRaster(mixed $image, string $mime, int $quality): ?string
    {
        $quality = max(1, min(100, $quality));

        ob_start();
        $ok = match ($mime) {
            'image/png' => imagepng($image, null, (int) round((100 - $quality) / 100 * 9)),
            'image/webp' => imagewebp($image, null, $quality),
            // image/jpeg fallback covers any resizable raster by default.
            default => imagejpeg($image, null, $quality),
        };
        $bytes = ob_get_clean();

        return $ok && is_string($bytes) && $bytes !== '' ? $bytes : null;
    }

    private function isImage(string $mimeType): bool
    {
        return str_starts_with($mimeType, 'image/');
    }
}
