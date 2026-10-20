<?php

namespace App\Http\Middleware;

use Closure;
use Core\Services\Contracts\LocaleResolverInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Symfony\Component\HttpFoundation\Response;

/**
 * Transport-level locale resolution for every request (global stack).
 *
 * Order: explicit `locale` cookie -> Accept-Language -> default. The
 * resolved locale is written to the request attributes (so downstream
 * layers such as Inertia sharing read one consistent answer), into
 * app()->setLocale() (Laravel validation/messages), and into Carbon
 * (localized date formatting).
 *
 * Authenticated account preferences are layered on top by
 * ApplyUserLocale, which rewrites these attributes when it applies.
 */
class SetLocale
{
    public const ATTRIBUTE = 'locale';

    public const SOURCE_ATTRIBUTE = 'locale.source';

    public function __construct(
        private LocaleResolverInterface $resolver,
    ) {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $resolved = $this->resolver->resolve($request);

        self::apply($request, $resolved['locale'], $resolved['source']);

        return $next($request);
    }

    /** Write a locale decision onto the request + application. */
    public static function apply(Request $request, string $locale, string $source): void
    {
        $request->attributes->set(self::ATTRIBUTE, $locale);
        $request->attributes->set(self::SOURCE_ATTRIBUTE, $source);

        app()->setLocale($locale);

        try {
            Carbon::setLocale($locale);
        } catch (\Throwable) {
            // Carbon rejects unknown locale strings; non-fatal.
        }
    }

    /** Current request locale (always set once SetLocale ran). */
    public static function locale(Request $request): string
    {
        return (string) $request->attributes->get(self::ATTRIBUTE, config('locales.default', 'en'));
    }

    /** How the locale was chosen: cookie|user|header|default. */
    public static function source(Request $request): string
    {
        return (string) $request->attributes->get(self::SOURCE_ATTRIBUTE, 'default');
    }
}
