<?php

namespace Core\Localization\Contracts;

interface TranslationProviderInterface
{
    /**
     * Translate a batch of plain-text strings.
     *
     * @param list<string> $texts
     * @return list<string> Translations aligned by index with $texts.
     *
     * @throws \Core\Localization\TranslationProviderUnavailable
     */
    public function translate(array $texts, string $target, ?string $source = null): array;

    /** Whether required credentials/endpoints are present. */
    public function configured(): bool;
}
