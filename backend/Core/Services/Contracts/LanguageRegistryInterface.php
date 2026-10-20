<?php

namespace Core\Services\Contracts;

/**
 * Language registry: the authoritative list of locales the platform can
 * render, merged from config('locales.supported') and the admin-managed
 * `languages` table. Never trust request input directly — resolve and
 * validate through this contract before using a locale in paths,
 * namespaces, or formatting.
 */
interface LanguageRegistryInterface
{
    /**
     * Every known locale keyed by short code, including disabled ones.
     *
     * @return array<string, array{
     *     code: string,
     *     name: string,
     *     native: string,
     *     dir: string,
     *     intl: string,
     *     flag: string|null,
     *     fallback: string|null,
     *     enabled: bool,
     *     guest_enabled: bool,
     *     sort_order: int
     * }>
     */
    public function all(): array;

    /**
     * Enabled locales only, ordered by sort_order (then config order).
     *
     * @return array<string, array<string, mixed>>
     */
    public function enabled(): array;

    /** Locale exists in the registry (enabled or not). */
    public function has(string $code): bool;

    /** Locale exists and is currently enabled. */
    public function enabledCode(string $code): bool;

    /** Default locale code (registry default, else config default, else 'en'). */
    public function default(): string;

    /** Fallback locale code used when a translation is missing. */
    public function fallback(): string;

    /**
     * Normalize a user-supplied locale to a known code.
     * Accepts BCP 47 variants ('en-US' -> 'en') and case differences.
     * Returns null when the value maps to no known locale.
     */
    public function normalize(string $value): ?string;

    /** Text direction for a known locale; 'ltr' otherwise. */
    public function dir(string $code): string;

    /** BCP 47 tag for Intl formatting; the code itself otherwise. */
    public function intl(string $code): string;

    /**
     * Metadata for one locale (null when unknown).
     *
     * @return array<string, mixed>|null
     */
    public function meta(string $code): ?array;
}
