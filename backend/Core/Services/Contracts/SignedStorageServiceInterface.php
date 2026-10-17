<?php

namespace Core\Services\Contracts;

interface SignedStorageServiceInterface
{
    /**
     * Generate a signed URL for a private file.
     *
     * @param string $path       Storage path (relative to disk root)
     * @param string $disk       Disk name ('local' for private, 's3' for cloud)
     * @param int    $expiration Minutes until URL expires (default: 60)
     * @param array  $context    Additional context for audit (entity_type, entity_id, action, etc.)
     *
     * @return string Signed URL
     */
    public function generateSignedUrl(string $path, string $disk = 'local', int $expiration = 60, array $context = []): string;

    /**
     * Validate a signed URL and return the resolved path if valid.
     *
     * @param string $signedUrl The signed URL to validate
     * @param string $disk      Expected disk name
     *
     * @return string|null Storage path if valid, null if invalid/expired
     */
    public function validateSignedUrl(string $signedUrl, string $disk = 'local'): ?string;

    /**
     * Stream a private file through a validated signed URL (for direct download).
     *
     * @param string $path        Storage path
     * @param string $disk        Disk name
     * @param string $filename    Download filename
     * @param array  $headers     Additional response headers
     *
     * @return \Symfony\Component\HttpFoundation\BinaryFileResponse
     */
    public function streamPrivateFile(string $path, string $disk, string $filename, array $headers = []);

    /**
     * Record an access attempt (audit).
     *
     * @param string $action      'generate' | 'validate' | 'stream' | 'denied'
     * @param string $path        Storage path
     * @param string $disk        Disk name
     * @param string|null $userId User who performed the action
     * @param array  $meta        Additional metadata
     */
    public function auditAccess(string $action, string $path, string $disk, ?string $userId, array $meta = []): void;
}