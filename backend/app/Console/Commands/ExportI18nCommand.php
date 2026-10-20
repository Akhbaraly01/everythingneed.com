<?php

namespace App\Console\Commands;

use Core\Localization\BundleManifest;
use Core\Localization\TranslationRepository;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

/**
 * Export authoritative lang files to versioned JSON bundles consumed by
 * the frontend i18next loader (multilingual Phase 0).
 *
 *   lang/{locale}/{ns}.php        -> public/i18n/{version}/{locale}/{ns}.json
 *   Modules/{M}/Lang/{locale}/*.php -> same bundle under namespace {m}
 *
 * The version is a content hash, so exports are deterministic: running
 * the command twice over unchanged files produces identical output and
 * `--check` (used in CI) fails when committed/spoken bundles drift.
 *
 * Usage:
 *   php artisan i18n:export             write bundles + manifest
 *   php artisan i18n:export --check     verify bundles are current (CI)
 *   php artisan i18n:export --prune     also delete stale version dirs
 *   php artisan i18n:export --path=x    custom output dir (tests)
 */
class ExportI18nCommand extends Command
{
    protected $signature = 'i18n:export
        {--check : Verify exported bundles match lang/ without writing}
        {--prune : Delete stale version directories after writing}
        {--path= : Output directory (defaults to public/i18n)}';

    protected $description = 'Export lang/ PHP translations to versioned JSON bundles for the frontend';

    public function handle(TranslationRepository $repository): int
    {
        $trees = $this->collect($repository);

        if ($trees === []) {
            $this->error('No lang files found under lang/ — nothing to export.');

            return self::FAILURE;
        }

        $version = $this->version($trees);
        $files = $this->buildFiles($trees, $version);
        $outDir = $this->resolveOutputDir();

        if ($this->option('check')) {
            return $this->check($outDir, $files);
        }

        $this->write($outDir, $files);

        if ($this->option('prune')) {
            $this->prune($outDir, $version);
        }

        $this->info(sprintf(
            'i18n:export — %d locale(s), %d namespace(s), version %s -> %s',
            count($trees),
            array_sum(array_map('count', $trees)),
            $version,
            $outDir,
        ));

        return self::SUCCESS;
    }

    /**
     * locale => namespace => tree, deterministically ordered and
     * recursively key-sorted so bundle bytes never depend on file
     * iteration or translation insertion order.
     *
     * @return array<string, array<string, array<string, mixed>>>
     */
    private function collect(TranslationRepository $repository): array
    {
        $trees = [];

        foreach ($repository->locales() as $locale) {
            $namespaces = $repository->discover($locale);

            if ($namespaces === []) {
                continue;
            }

            $trees[$locale] = $namespaces;
        }

        ksort($trees);

        return $trees;
    }

    /**
     * @param array<string, array<string, array<string, mixed>>> $trees
     */
    private function version(array $trees): string
    {
        $fingerprint = [];

        foreach ($trees as $locale => $namespaces) {
            foreach ($namespaces as $namespace => $tree) {
                $fingerprint[] = $locale.'/'.$namespace.':'.$this->encode($tree);
            }
        }

        return substr(sha1(implode("\n", $fingerprint)), 0, 12);
    }

    /**
     * Relative path => exact file contents.
     *
     * @param array<string, array<string, array<string, mixed>>> $trees
     * @return array<string, string>
     */
    private function buildFiles(array $trees, string $version): array
    {
        $files = [];
        $localeIndex = [];

        foreach ($trees as $locale => $namespaces) {
            $namespaces = $this->sortTree($namespaces);
            $localeIndex[$locale] = array_keys($namespaces);

            foreach ($namespaces as $namespace => $tree) {
                $files[$version.'/'.$locale.'/'.$namespace.'.json'] = $this->encode($tree)."\n";
            }
        }

        $files['manifest.json'] = $this->encode([
            'version' => $version,
            'locales' => $localeIndex,
        ])."\n";

        return $files;
    }

    /** @param array<string, mixed> $tree */
    private function encode(array $tree): string
    {
        $encoded = json_encode(
            $tree,
            JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES,
        );

        return is_string($encoded) ? $encoded : '{}';
    }

    /** @param array<string, mixed> $tree @return array<string, mixed> */
    private function sortTree(array $tree): array
    {
        ksort($tree);

        foreach ($tree as $key => $value) {
            if (is_array($value)) {
                $tree[$key] = $this->sortTree($value);
            }
        }

        return $tree;
    }

    /** @param array<string, string> $files */
    private function check(string $outDir, array $files): int
    {
        $stale = [];

        foreach ($files as $relative => $contents) {
            $path = $outDir.DIRECTORY_SEPARATOR.str_replace('/', DIRECTORY_SEPARATOR, $relative);

            if (! is_file($path) || file_get_contents($path) !== $contents) {
                $stale[] = $relative;
            }
        }

        foreach ($this->staleVersionDirs($outDir, $this->currentVersionFromManifest($outDir)) as $dir) {
            $stale[] = basename($dir).'/ (stale version directory)';
        }

        if ($stale !== []) {
            $this->error('i18n bundles are out of date:');

            foreach ($stale as $entry) {
                $this->line('  - '.$entry);
            }

            $this->line('Run `php artisan i18n:export --prune` and commit the result.');

            return self::FAILURE;
        }

        $this->info('i18n bundles are up to date.');

        return self::SUCCESS;
    }

    /** @param array<string, string> $files */
    private function write(string $outDir, array $files): void
    {
        foreach ($files as $relative => $contents) {
            $path = $outDir.DIRECTORY_SEPARATOR.str_replace('/', DIRECTORY_SEPARATOR, $relative);
            File::ensureDirectoryExists(dirname($path));
            File::put($path, $contents);
        }
    }

    private function prune(string $outDir, string $currentVersion): void
    {
        foreach (File::directories($outDir) as $dir) {
            if (basename($dir) !== $currentVersion) {
                File::deleteDirectory($dir);
                $this->line('pruned '.$dir);
            }
        }
    }

    /** @return list<string> */
    private function staleVersionDirs(string $outDir, ?string $currentVersion): array
    {
        if ($currentVersion === null || ! is_dir($outDir)) {
            return [];
        }

        $stale = [];

        foreach (File::directories($outDir) as $dir) {
            if (basename($dir) !== $currentVersion) {
                $stale[] = $dir;
            }
        }

        return $stale;
    }

    private function currentVersionFromManifest(string $outDir): ?string
    {
        $manifest = $outDir.DIRECTORY_SEPARATOR.'manifest.json';

        if (! is_file($manifest)) {
            return null;
        }

        $decoded = json_decode((string) file_get_contents($manifest), true);
        $version = is_array($decoded) ? ($decoded['version'] ?? null) : null;

        return is_string($version) && $version !== '' ? $version : null;
    }

    private function resolveOutputDir(): string
    {
        $path = $this->option('path');

        if (! is_string($path) || $path === '') {
            return BundleManifest::path();
        }

        $isAbsolute = (bool) preg_match('/^([A-Za-z]:[\\\\\/]|\/)/', $path);

        return $isAbsolute ? rtrim($path, '\\/') : base_path(trim($path, '\\/'));
    }
}
