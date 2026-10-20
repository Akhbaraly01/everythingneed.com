<?php

namespace Core\Localization;

/**
 * Shared resolution for the versioned i18next bundles written by
 * `php artisan i18n:export` and read back by the Inertia boot payload
 * and the admin export summary.
 *
 * The root lives in config `locales.bundles_path` (overridable via the
 * I18N_BUNDLES_PATH env or runtime config) so tests can export to a
 * throwaway directory without polluting public/i18n.
 */
final class BundleManifest
{
    /** Absolute bundle root (no trailing separator). */
    public static function path(): string
    {
        $configured = config('locales.bundles_path');

        if (is_string($configured) && $configured !== '') {
            return rtrim($configured, '\\/');
        }

        return rtrim(public_path('i18n'), '\\/');
    }

    public static function manifestFile(): string
    {
        return self::path().DIRECTORY_SEPARATOR.'manifest.json';
    }

    /**
     * Decoded manifest summary or null when missing/invalid.
     *
     * @return array{version: string|null, locales: list<string>}|null
     */
    public static function read(): ?array
    {
        try {
            $file = self::manifestFile();
            $decoded = is_file($file) ? json_decode((string) file_get_contents($file), true) : null;
        } catch (\Throwable) {
            return null;
        }

        if (! is_array($decoded)) {
            return null;
        }

        return [
            'version' => is_string($decoded['version'] ?? null) && $decoded['version'] !== ''
                ? $decoded['version']
                : null,
            'locales' => array_keys(is_array($decoded['locales'] ?? null) ? $decoded['locales'] : []),
        ];
    }
}