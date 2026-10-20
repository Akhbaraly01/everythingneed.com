<?php

namespace Core\Localization;

/**
 * Reads authoritative translation files.
 *
 * Layout (Laravel convention + module-owned namespaces):
 *   lang/{locale}/{namespace}.php            -> namespace = file name
 *   Modules/{Module}/Lang/{locale}/{file}.php -> namespace = lowercased
 *                                                module name, contents
 *                                                nested under file name
 *                                                (t('module:file.key')).
 *
 * This repository is the only reader used by the Inertia boot payload
 * and the i18n:export command, so the frontend dictionaries always
 * trace back to these files. Locale and namespace segments are
 * validated before touching the filesystem — request input must never
 * reach a path directly.
 */
class TranslationRepository
{
    /** @var string Absolute lang root (injectable for tests). */
    private string $root;

    /** @var array<string, array<string, mixed>> */
    private array $fileCache = [];
    public function __construct(?string $root = null)
    {
        $this->root = $root ?: base_path('lang');
    }

    private function langRoot(): string
    {
        return $this->root;
    }

    /**
     * Locales that have a lang/ directory on disk.
     *
     * @return list<string>
     */
    public function locales(): array
    {
        $dirs = glob($this->langRoot().'/*', GLOB_ONLYDIR) ?: [];
        $locales = [];

        foreach ($dirs as $dir) {
            $code = strtolower(basename($dir));

            if ($this->isValidSegment($code)) {
                $locales[] = $code;
            }
        }

        sort($locales);

        return $locales;
    }

    /**
     * Namespaces available for a locale (global files + module
     * namespaces), sorted for deterministic exports.
     *
     * @return list<string>
     */
    public function namespaces(string $locale): array
    {
        if (! $this->isValidSegment($locale)) {
            return [];
        }

        $namespaces = [];

        foreach ($this->globalFiles($locale) as $file) {
            $namespaces[] = basename($file, '.php');
        }

        foreach ($this->moduleFiles($locale) as $module => $files) {
            $namespaces[] = $module;
        }

        $namespaces = array_values(array_unique($namespaces));
        sort($namespaces);

        return $namespaces;
    }

    /**
     * Full tree for one namespace.
     *
     * @return array<string, mixed>
     */
    public function tree(string $locale, string $namespace): array
    {
        if (! $this->isValidSegment($locale) || ! $this->isValidSegment($namespace)) {
            return [];
        }

        foreach ($this->globalFiles($locale) as $file) {
            if (basename($file, '.php') === $namespace) {
                return $this->read($file);
            }
        }

        $files = $this->moduleFiles($locale)[$namespace] ?? [];

        $tree = [];

        foreach ($files as $file) {
            $tree[basename($file, '.php')] = $this->read($file);
        }

        return $tree;
    }

    /**
     * Every namespace tree for a locale.
     *
     * @return array<string, array<string, mixed>>
     */
    public function discover(string $locale): array
    {
        $discovered = [];

        foreach ($this->namespaces($locale) as $namespace) {
            $discovered[$namespace] = $this->tree($locale, $namespace);
        }

        return $discovered;
    }

    /**
     * Flattened key => value map for parity/coverage tooling.
     *
     * @return array<string, string>
     */
    public function flatten(string $locale, string $namespace): array
    {
        return $this->flattenTree($this->tree($locale, $namespace));
    }

    /**
     * @param array<string, mixed> $tree
     * @return array<string, string>
     */
    private function flattenTree(array $tree, string $prefix = ''): array
    {
        $flat = [];

        foreach ($tree as $key => $value) {
            $path = $prefix === '' ? (string) $key : $prefix.'.'.$key;

            if (is_array($value)) {
                $flat += $this->flattenTree($value, $path);
            } elseif (is_string($value)) {
                $flat[$path] = $value;
            }
        }

        return $flat;
    }

    /**
     * @return list<string>
     */
    private function globalFiles(string $locale): array
    {
        $files = glob($this->langRoot().'/'.$locale.'/*.php') ?: [];
        sort($files);

        return $files;
    }

    /**
     * @return array<string, list<string>>
     */
    private function moduleFiles(string $locale): array
    {
        $dirs = glob(base_path('Modules/*/Lang/'.$locale), GLOB_ONLYDIR) ?: [];
        $modules = [];

        foreach ($dirs as $dir) {
            $parts = explode(DIRECTORY_SEPARATOR, $dir);
            $index = array_search('Modules', $parts, true);

            if ($index === false || ! isset($parts[$index + 1])) {
                continue;
            }

            $module = strtolower($parts[$index + 1]);

            if (! $this->isValidSegment($module)) {
                continue;
            }

            $files = glob($dir.'/*.php') ?: [];
            sort($files);
            $modules[$module] = $files;
        }

        ksort($modules);

        return $modules;
    }

    /**
     * @return array<string, mixed>
     */
    private function read(string $file): array
    {
        if (isset($this->fileCache[$file])) {
            return $this->fileCache[$file];
        }

        try {
            $data = require $file;
        } catch (\Throwable) {
            $data = [];
        }

        return $this->fileCache[$file] = is_array($data) ? $data : [];
    }

    private function isValidSegment(string $segment): bool
    {
        return (bool) preg_match('/^[a-z][a-z0-9_-]{0,31}$/i', $segment);
    }
}
