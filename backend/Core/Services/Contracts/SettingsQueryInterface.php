<?php

namespace Core\Services\Contracts;

/**
 * System settings + feature flags (Settings domain).
 * Implemented by Modules\Settings.
 */
interface SettingsQueryInterface
{
    /** key => value map of all system settings. */
    public function all(): array;

    /**
     * Upsert a batch of settings.
     *
     * @param  array<array{key: string, value: mixed}>  $items
     */
    public function updateMany(array $items, ?string $actorId): void;

    /**
     * Remove one system setting (keys are immutable identifiers — delete
     * and re-create is the rename path).
     *
     * @return string ok | missing
     */
    public function delete(string $key, ?string $actorId): string;

    public function featureFlags(): array;

    /**
     * Toggle an existing feature flag (unknown keys are rejected — flags
     * are managed through the seeder/migrations, not arbitrary API keys).
     *
     * @return string enabled | disabled | missing
     */
    public function toggleFlag(string $key, bool $enabled, ?string $actorId): string;
}
