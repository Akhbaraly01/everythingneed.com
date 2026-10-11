<?php

namespace Core\Services\Contracts;

/**
 * Editable system text (Settings domain, config/ui_texts.php defaults).
 * Implemented by Core\Services\UiTextService.
 */
interface UiTextServiceInterface
{
    /**
     * key => ['label' => string, 'value' => string] for every wired UI
     * text, with stored `system_settings` values overriding defaults.
     *
     * @return array<string, array{label: string, value: string}>
     */
    public function all(): array;
}
