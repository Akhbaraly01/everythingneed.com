<?php

namespace Core\Services\Contracts;

use Illuminate\Http\Request;

/**
 * Resolves the request locale from transport-level signals only:
 * explicit `locale` cookie -> Accept-Language negotiation -> default.
 *
 * The authenticated user's saved preference is applied one layer above
 * this resolver (see App\Http\Middleware\ApplyUserLocale) because it
 * requires a started session. Precedence overall:
 *
 *   explicit selection (cookie) > account preference > guest local
 *   choice (mirrored into the cookie by the client) > browser
 *   Accept-Language > configured default.
 */
interface LocaleResolverInterface
{
    /**
     * @return array{locale: string, source: 'cookie'|'header'|'default'}
     */
    public function resolve(Request $request): array;

    /** Negotiated locale from Accept-Language, or null when none match. */
    public function fromAcceptLanguage(Request $request): ?string;

    /** Cookie locale when present, known and enabled; else null. */
    public function fromCookie(Request $request): ?string;
}
