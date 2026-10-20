<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Services\UserPreferencesService;
use Core\Services\Contracts\LanguageRegistryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Explicit language selection endpoint (Phase 0 of the multilingual
 * system). The frontend calls this whenever the user picks a language:
 *
 *  - sets the long-lived `locale` cookie (transport-level signal that
 *    SetLocale reads on every request, including guests), and
 *  - for authenticated users, persists the choice to their account so
 *    other browsers/devices follow it.
 *
 * Values are validated against the language registry; unknown or
 * disabled locales are rejected with a 422.
 */
class LocaleController extends Controller
{
    public function update(
        Request $request,
        LanguageRegistryInterface $registry,
        UserPreferencesService $preferences,
    ): JsonResponse {
        $validated = $request->validate([
            'locale' => ['required', 'string', 'max:16'],
        ]);

        $locale = $registry->normalize($validated['locale']);

        if ($locale === null || ! $registry->enabledCode($locale)) {
            return response()->json([
                'message' => 'Unsupported locale.',
            ], 422);
        }

        if ($user = $request->user()) {
            $preferences->setLanguage($user, $locale);
        }

        return response()
            ->json([
                'data' => [
                    'locale' => $locale,
                    'dir' => $registry->dir($locale),
                ],
            ])
            ->withCookie(cookie(
                (string) config('locales.cookie', 'locale'),
                $locale,
                (int) config('locales.cookie_minutes', 525600),
                '/',
                null,
                $request->isSecure(),
                false,
                false,
                'lax',
            ));
    }
}
