<?php

namespace Core\Services;

use Carbon\Carbon;
use Core\Services\Contracts\SignedStorageServiceInterface;
use Core\Services\Contracts\AuditServiceInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class SignedStorageService extends BaseService implements SignedStorageServiceInterface
{
    private const URL_SIGNATURE_PARAM = 'signature';
    private const URL_EXPIRES_PARAM = 'expires';
    private const URL_PATH_PARAM = 'path';
    private const URL_DISK_PARAM = 'disk';

    public function generateSignedUrl(string $path, string $disk = 'local', int $expiration = 60, array $context = []): string
    {
        $expiresAt = Carbon::now()->addMinutes($expiration);

        // NOTE: pass the Carbon instance, not ->timestamp — the generator's
        // availableAt() treats bare numbers as seconds-of-delay, which would
        // turn a unix timestamp into a decades-away expiry.
        $url = URL::temporarySignedRoute(
            'signed.storage.stream',
            $expiresAt,
            [
                self::URL_PATH_PARAM => $path,
                self::URL_DISK_PARAM => $disk,
            ]
        );

        $userId = request()->user()?->id ?? $context['performed_by'] ?? null;
        $this->auditAccess('generate', $path, $disk, $userId, array_merge($context, [
            'expires_at' => $expiresAt->toIso8601String(),
            'url' => $url,
        ]));

        return $url;
    }

    public function validateSignedUrl(string $signedUrl, string $disk = 'local'): ?string
    {
        $request = Request::create($signedUrl, 'GET');

        if (! $request->hasValidSignature()) {
            $this->auditAccess('denied', 'unknown', $disk, null, [
                'reason' => 'invalid_signature',
                'url' => $signedUrl,
            ]);
            return null;
        }

        $path = $request->query(self::URL_PATH_PARAM);
        $urlDisk = $request->query(self::URL_DISK_PARAM);

        if ($urlDisk !== $disk) {
            $this->auditAccess('denied', $path ?? 'unknown', $disk, null, [
                'reason' => 'disk_mismatch',
                'expected_disk' => $disk,
                'url_disk' => $urlDisk,
                'url' => $signedUrl,
            ]);
            return null;
        }

        if ($path === null || ! Storage::disk($disk)->exists($path)) {
            $this->auditAccess('denied', $path ?? 'unknown', $disk, null, [
                'reason' => 'file_not_found',
                'url' => $signedUrl,
            ]);
            return null;
        }

        $this->auditAccess('validate', $path, $disk, $request->user()?->id, [
            'url' => $signedUrl,
        ]);

        return $path;
    }

    public function streamPrivateFile(string $path, string $disk, string $filename, array $headers = []): BinaryFileResponse
    {
        $file = Storage::disk($disk)->path($path);
        $mimeType = Storage::disk($disk)->mimeType($path);

        $response = new BinaryFileResponse($file, 200, array_merge([
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'attachment; filename="'.Str::slug(pathinfo($filename, PATHINFO_FILENAME)).'.'.pathinfo($filename, PATHINFO_EXTENSION).'"',
            'Cache-Control' => 'no-store, no-cache, must-revalidate',
            'X-Content-Type-Options' => 'nosniff',
        ], $headers));

        $response->setFile($file);

        return $response;
    }

    public function auditAccess(string $action, string $path, string $disk, ?string $userId, array $meta = []): void
    {
        try {
            $audit = app(AuditServiceInterface::class);
            $audit->log([
                'action' => 'storage.'.$action,
                'entity_type' => 'signed_storage',
                'entity_id' => Str::uuid()->toString(),
                'performed_by' => $userId,
                'new_values' => array_merge([
                    'path' => $path,
                    'disk' => $disk,
                    'action' => $action,
                ], $meta),
            ]);
        } catch (\Throwable) {
        }
    }
}