<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Vite;
use Symfony\Component\HttpFoundation\Response;

/**
 * Baseline security headers for every response (web, api, module routes).
 *
 * CSP notes:
 * - script-src 'self' + a per-request nonce: Vite bundles ship
 *   same-origin; the inline pre-paint scripts in app.blade.php (theme
 *   tier, locale sync, JSON-LD) carry the nonce. In dev the HTML
 *   document is served by the Vite dev server, so this header never
 *   governs HMR. External player SDKs (YouTube IFrame API, Vimeo
 *   Player, Jitsi external_api.js) are the only allowlisted script
 *   origins so media plays inside the app instead of bouncing to the
 *   provider site.
 * - frame-src allowlists the embed players (YouTube/Vimeo/Facebook/TikTok)
 *   and the configured video-room host (Jitsi). No other origin can be
 *   framed, so stored URLs still cannot open arbitrary embeds.
 * - Permissions-Policy keeps camera/microphone closed everywhere except
 *   the video-room host, which needs them for live consultations.
 * - style-src allows 'unsafe-inline' (Inertia/Tailwind element styles)
 *   plus fonts.bunny.net (the only external origin in app.blade.php).
 * - img-src keeps data:/blob: for previews and allows https: because
 *   admin/user content may reference externally hosted media.
 * - HSTS and upgrade-insecure-requests are only emitted on HTTPS requests.
 */
class SecurityHeaders
{
    /** Embed players that render inside our pages (never leave the app). */
    private const EMBED_FRAMES = [
        'https://www.youtube.com',
        'https://www.youtube-nocookie.com',
        'https://player.vimeo.com',
        'https://www.facebook.com',
        'https://www.tiktok.com',
    ];

    /**
     * Origins the Google Translate Website Widget (engine=google) needs.
     *
     * element.js pulls its stylesheet from gstatic.com and its language
     * list from translate-pa.googleapis.com; without these two the widget
     * loads but never translates the page.
     */
    private const TRANSLATE_ORIGINS = [
        'https://translate.google.com',
        'https://translate.googleapis.com',
        'https://translate-pa.googleapis.com',
        'https://www.gstatic.com',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        // Per-request nonce for the handful of inline scripts in
        // app.blade.php (theme/quality pre-paint, locale pre-paint,
        // JSON-LD). Vite::useCspNonce also stamps @vite/dev tags; blade
        // reads it back via Vite::cspNonce().
        $nonce = base64_encode(random_bytes(16));
        Vite::useCspNonce($nonce);

        $response = $next($request);

        // Video-room host (Jitsi by default) is config-driven so a
        // self-hosted VIDEO_BASE_URL swaps need no header edits.
        $videoHost = parse_url((string) config('services.video.base_url'), PHP_URL_HOST) ?: 'meet.jit.si';
        $videoOrigin = 'https://'.$videoHost;

        $frameSrc = implode(' ', [
            "'self'",
            ...self::EMBED_FRAMES,
            $videoOrigin,
            // Path A: Google Translate Website Widget (engine=google).
            ...self::TRANSLATE_ORIGINS,
        ]);
        $scriptSrc = implode(' ', [
            "'self'",
            "'nonce-".$nonce."'",
            'https://www.youtube.com',
            'https://player.vimeo.com',
            $videoOrigin,
            ...self::TRANSLATE_ORIGINS,
        ]);

        $headers = [
            'X-Content-Type-Options' => 'nosniff',
            'X-Frame-Options' => 'SAMEORIGIN',
            'Referrer-Policy' => 'strict-origin-when-cross-origin',
            'Permissions-Policy' => implode(', ', [
                'accelerometer=()',
                'camera=(self "'.$videoOrigin.'")',
                'geolocation=()',
                'gyroscope=()',
                'magnetometer=()',
                'microphone=(self "'.$videoOrigin.'")',
                'payment=()',
                'usb=()',
            ]),
            'X-Permitted-Cross-Domain-Policies' => 'none',
            'Cross-Origin-Opener-Policy' => 'same-origin-allow-popups',
            'Content-Security-Policy' => implode('; ', [
                "default-src 'self'",
                "base-uri 'self'",
                "font-src 'self' https://fonts.bunny.net https://www.gstatic.com",
                "form-action 'self'",
                "frame-ancestors 'self'",
                'frame-src '.$frameSrc,
                "img-src 'self' data: blob: https:",
                "object-src 'none'",
                'script-src '.$scriptSrc,
                "style-src 'self' 'unsafe-inline' https://fonts.bunny.net ".implode(' ', self::TRANSLATE_ORIGINS),
                "connect-src 'self' https: ws: wss:",
                "media-src 'self' blob: https:",
                "worker-src 'self' blob:",
            ]),
        ];

        if ($request->isSecure()) {
            $headers['Strict-Transport-Security'] = 'max-age=15552000; includeSubDomains';
            $headers['Content-Security-Policy'] .= '; upgrade-insecure-requests';
        }

        foreach ($headers as $name => $value) {
            $response->headers->set($name, $value);
        }

        return $response;
    }
}
