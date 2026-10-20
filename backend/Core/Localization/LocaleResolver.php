<?php

namespace Core\Localization;

use Core\Services\Contracts\LanguageRegistryInterface;
use Core\Services\Contracts\LocaleResolverInterface;
use Illuminate\Http\Request;

/**
 * Transport-level locale resolution: explicit cookie -> Accept-Language
 * -> registry default. Account preference is applied by
 * App\Http\Middleware\ApplyUserLocale (needs a session).
 */
class LocaleResolver implements LocaleResolverInterface
{
    public function __construct(
        private LanguageRegistryInterface $registry,
    ) {
    }

    public function resolve(Request $request): array
    {
        if ($locale = $this->fromCookie($request)) {
            return ['locale' => $locale, 'source' => 'cookie'];
        }

        if ($locale = $this->fromAcceptLanguage($request)) {
            return ['locale' => $locale, 'source' => 'header'];
        }

        return ['locale' => $this->registry->default(), 'source' => 'default'];
    }

    public function fromCookie(Request $request): ?string
    {
        $cookie = $request->cookie((string) config('locales.cookie', 'locale'));

        if (! is_string($cookie) || $cookie === '') {
            return null;
        }

        $code = $this->registry->normalize($cookie);

        return $code !== null && $this->registry->enabledCode($code) ? $code : null;
    }

    public function fromAcceptLanguage(Request $request): ?string
    {
        try {
            $languages = $request->getLanguages();
        } catch (\Throwable) {
            $languages = [];
        }

        foreach ($languages as $language) {
            if (! is_string($language)) {
                continue;
            }

            $code = $this->registry->normalize($language);

            if ($code !== null && $this->registry->enabledCode($code)) {
                return $code;
            }
        }

        return null;
    }
}
