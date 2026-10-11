<?php

namespace Core\Services;

use Core\Services\Contracts\SettingsQueryInterface;
use Core\Services\Contracts\UiTextServiceInterface;

/**
 * Merges config/ui_texts.php defaults with any stored `ui.*` rows from
 * system_settings. Reads go through SettingsQueryInterface (cached and
 * cache-flushed by the Settings domain on every write), so edits made in
 * the console appear immediately - no separate cache layer here.
 */
class UiTextService implements UiTextServiceInterface
{
    public function __construct(
        private SettingsQueryInterface $settings,
    ) {
    }

    public function all(): array
    {
        /** @var array<string, array{label: string, value: string}> $texts */
        $texts = config('ui_texts', []);

        foreach ($this->settings->all() as $key => $value) {
            if (! str_starts_with((string) $key, 'ui.')) {
                continue;
            }

            if (isset($texts[$key])) {
                $texts[$key]['value'] = (string) $value;
            } else {
                // Runtime-created key: editable and shared, labelled by itself
                // until it gets a wired label in config/ui_texts.php.
                $texts[$key] = ['label' => (string) $key, 'value' => (string) $value];
            }
        }

        return $texts;
    }
}
