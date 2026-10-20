<?php

namespace App\Http\Middleware;

use App\Services\UserPreferencesService;
use Closure;
use Core\Services\Contracts\LocaleResolverInterface;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Layered on top of SetLocale for web (session) requests: the signed-in
 * account's saved language wins over Accept-Language.
 *
 * Conflict rule when both an explicit cookie choice and an account
 * preference exist: the explicit choice wins and is synced into the
 * account so the next sign-in elsewhere agrees. When there is no cookie
 * (fresh browser), the account preference wins.
 *
 * Guests keep the transport-level resolution from SetLocale.
 */
class ApplyUserLocale
{
    public function __construct(
        private LocaleResolverInterface $resolver,
        private UserPreferencesService $preferences,
    ) {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null) {
            return $next($request);
        }

        $cookieLocale = $this->resolver->fromCookie($request);
        $accountLocale = $this->preferences->languageFor($user);

        if ($cookieLocale !== null && $cookieLocale !== $accountLocale) {
            $this->preferences->setLanguage($user, $cookieLocale);
            $accountLocale = $cookieLocale;
        }

        $locale = $cookieLocale ?? $accountLocale;

        if ($locale !== null) {
            SetLocale::apply($request, $locale, $cookieLocale !== null ? 'cookie' : 'user');
        }

        return $next($request);
    }
}
