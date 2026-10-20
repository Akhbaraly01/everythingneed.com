<?php

namespace Core\Localization;

use Core\Services\Contracts\LanguageRegistryInterface;

/**
 * Config-backed language registry.
 *
 * config('locales.supported') is the single source of truth for the
 * locales the platform renders. Each entry may set `enabled` and
 * `guest_enabled`; `locales.default` picks the default. No database
 * lookup: the whole-page translator (AutoTranslateBridge) handles
 * content, while this registry only drives locale resolution and the
 * picker.
 *
 * One instance answers consistently for the lifetime of a request.
 */
class LanguageRegistry implements LanguageRegistryInterface
{
    /** @var array<string, array<string, mixed>>|null */
    private ?array $cache = null;

    public function all(): array
    {
        if ($this->cache !== null) {
            return $this->cache;
        }

        $supported = config('locales.supported', []);
        $default = $this->normalizeKey((string) config('locales.default', 'en'));

        $merged = [];
        $order = 0;

        foreach ($supported as $code => $meta) {
            $code = strtolower((string) $code);

            if (! $this->isValidCode($code)) {
                continue;
            }

            $entry = $this->defaults($code, is_array($meta) ? $meta : []);
            $entry['sort_order'] = $order;
            $entry['is_default'] = $code === $default;
            $order += 10;
            $merged[$code] = $entry;
        }

        uasort($merged, static fn (array $a, array $b): int => $a['sort_order'] <=> $b['sort_order']);

        return $this->cache = $merged;
    }

    public function enabled(): array
    {
        return array_filter($this->all(), static fn (array $entry): bool => (bool) $entry['enabled']);
    }

    public function has(string $code): bool
    {
        return isset($this->all()[$this->normalizeKey($code)]);
    }

    public function enabledCode(string $code): bool
    {
        $normalized = $this->normalizeKey($code);

        return isset($this->all()[$normalized]) && (bool) $this->all()[$normalized]['enabled'];
    }

    public function default(): string
    {
        $fallbackDefault = $this->normalizeKey((string) config('locales.default', 'en'));

        foreach ($this->all() as $code => $entry) {
            if (! empty($entry['is_default']) && ! empty($entry['enabled'])) {
                return $code;
            }
        }

        if ($fallbackDefault !== '' && $this->enabledCode($fallbackDefault)) {
            return $fallbackDefault;
        }

        foreach ($this->all() as $code => $entry) {
            if (! empty($entry['enabled'])) {
                return $code;
            }
        }

        return 'en';
    }

    public function fallback(): string
    {
        $fallback = $this->normalizeKey((string) config('locales.fallback', 'en'));

        return $this->has($fallback) ? $fallback : $this->default();
    }

    public function normalize(string $value): ?string
    {
        $value = strtolower(trim($value));

        if ($value === '') {
            return null;
        }

        $all = $this->all();

        if (isset($all[$value])) {
            return $value;
        }

        // BCP 47 variants: 'en-US' -> 'en', 'pt_BR' -> 'pt'.
        $primary = preg_replace('/[-_].*$/', '', $value);

        if (is_string($primary) && $primary !== '' && isset($all[$primary])) {
            return $primary;
        }

        return null;
    }

    public function dir(string $code): string
    {
        $meta = $this->meta($code);

        return ($meta['dir'] ?? 'ltr') === 'rtl' ? 'rtl' : 'ltr';
    }

    public function intl(string $code): string
    {
        $meta = $this->meta($code);

        return is_string($meta['intl'] ?? null) && $meta['intl'] !== ''
            ? (string) $meta['intl']
            : $this->normalizeKey($code);
    }

    public function meta(string $code): ?array
    {
        $normalized = $this->normalize($code);

        return $normalized !== null ? $this->all()[$normalized] : null;
    }

    /**
     * @param array<string, mixed> $meta
     * @return array<string, mixed>
     */
    private function defaults(string $code, array $meta): array
    {
        $name = (string) ($meta['name'] ?? $code);

        return [
            'code' => $code,
            'name' => $name,
            'native' => (string) ($meta['native'] ?? $name),
            'dir' => ($meta['dir'] ?? 'ltr') === 'rtl' ? 'rtl' : 'ltr',
            'intl' => (string) ($meta['intl'] ?? $code),
            'flag' => is_string($meta['flag'] ?? null) ? $meta['flag'] : null,
            'fallback' => is_string($meta['fallback'] ?? null) ? strtolower($meta['fallback']) : null,
            'enabled' => (bool) ($meta['enabled'] ?? true),
            'guest_enabled' => (bool) ($meta['guest_enabled'] ?? true),
            'is_default' => false,
            'sort_order' => 10000,
        ];
    }

    private function normalizeKey(string $code): string
    {
        return strtolower(trim($code));
    }

    private function isValidCode(string $code): bool
    {
        return (bool) preg_match('/^[a-z0-9][a-z0-9_-]{0,11}$/', $code);
    }
}
