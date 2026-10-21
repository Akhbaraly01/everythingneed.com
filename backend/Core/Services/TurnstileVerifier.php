<?php

namespace Core\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Phase 5: Cloudflare Turnstile verification for auth endpoints.
 *
 * Active only when TURNSTILE_SECRET is configured; otherwise verification
 * is skipped (warning logged) so local/test/dev keep working without keys.
 * Production runbook mandates both TURNSTILE_SECRET and the public
 * VITE_TURNSTILE_SITE_KEY — SecurityPostureTest pins the wiring.
 */
class TurnstileVerifier
{
    private const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

    public function configured(): bool
    {
        return (string) config('services.turnstile.secret', '') !== '';
    }

    /**
     * Whether the bot defence must be active in this environment.
     *
     * Default: required in production (where an unverified login is an
     * open door), skipped in local/test/dev so the suite and a fresh
     * checkout keep working without keys. TURNSTILE_REQUIRED overrides it.
     */
    public function required(): bool
    {
        $required = config('services.turnstile.required');

        if ($required !== null) {
            return (bool) $required;
        }

        return app()->isProduction();
    }

    public function verify(?string $token, ?string $ip = null): bool
    {
        if (!$this->configured()) {
            Log::warning('Turnstile verification skipped: TURNSTILE_SECRET is not configured.');
            return true;
        }

        if (!is_string($token) || $token === '') {
            return false;
        }

        try {
            $response = Http::asForm()->timeout(10)->post(self::VERIFY_URL, array_filter([
                'secret' => (string) config('services.turnstile.secret'),
                'response' => $token,
                'remoteip' => $ip,
            ]));

            return (bool) ($response->json('success') ?? false);
        } catch (\Throwable $e) {
            // Fail closed on transport errors: a bot wave must not slip
            // through on an outage, and the client can retry the widget.
            Log::warning('Turnstile verification transport failure: ' . $e->getMessage());

            return false;
        }
    }

    public function siteKey(): string
    {
        return (string) config('services.turnstile.site_key', '');
    }
}
