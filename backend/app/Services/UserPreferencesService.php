<?php

namespace App\Services;

use App\Models\User;
use Core\Services\Contracts\LanguageRegistryInterface;
use Modules\Settings\Entities\UserSetting;

/**
 * Reads and writes the authenticated user's display preferences
 * (currently the account language). Values are always validated against
 * the language registry before they are trusted or stored.
 */
class UserPreferencesService
{
    public const LANGUAGE_KEY = 'general.language';

    public function __construct(
        private LanguageRegistryInterface $registry,
    ) {
    }

    /** Validated account language, or null when unset/unknown/disabled. */
    public function languageFor(User $user): ?string
    {
        try {
            $stored = UserSetting::query()
                ->where('user_id', $user->id)
                ->where('key', self::LANGUAGE_KEY)
                ->first()?->value;
        } catch (\Throwable) {
            return null;
        }

        if (! is_string($stored) || $stored === '') {
            return null;
        }

        $code = $this->registry->normalize($stored);

        return $code !== null && $this->registry->enabledCode($code) ? $code : null;
    }

    /** Persist a validated account language. */
    public function setLanguage(User $user, string $locale): bool
    {
        $code = $this->registry->normalize($locale);

        if ($code === null || ! $this->registry->enabledCode($code)) {
            return false;
        }

        try {
            UserSetting::updateOrCreate(
                ['user_id' => $user->id, 'key' => self::LANGUAGE_KEY],
                ['value' => $code],
            );
        } catch (\Throwable) {
            return false;
        }

        return true;
    }
}
