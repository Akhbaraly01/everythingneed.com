<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Baseline security headers for every response (web, api, module routes).
 *
 * CSP notes:
 * - script-src 'self': all scripts ship as same-origin Vite bundles; no
 *   blade file contains an inline <script>. In dev the HTML document is
 *   served by the Vite dev server, so this header never governs HMR.
 * - style-src allows 'unsafe-inline' (Inertia/Tailwind element styles)
 *   plus fonts.bunny.net (the only external origin in app.blade.php).
 * - img-src keeps data:/blob: for previews and allows https: because
 *   admin/user content may reference externally hosted media.
 * - HSTS and upgrade-insecure-requests are only emitted on HTTPS requests.
 */
class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $headers = [
            'X-Content-Type-Options' => 'nosniff',
            'X-Frame-Options' => 'SAMEORIGIN',
            'Referrer-Policy' => 'strict-origin-when-cross-origin',
            'Permissions-Policy' => 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
            'X-Permitted-Cross-Domain-Policies' => 'none',
            'Cross-Origin-Opener-Policy' => 'same-origin-allow-popups',
            'Content-Security-Policy' => implode('; ', [
                "default-src 'self'",
                "base-uri 'self'",
                "font-src 'self' https://fonts.bunny.net",
                "form-action 'self'",
                "frame-ancestors 'self'",
                "img-src 'self' data: blob: https:",
                "object-src 'none'",
                "script-src 'self'",
                "style-src 'self' 'unsafe-inline' https://fonts.bunny.net",
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
