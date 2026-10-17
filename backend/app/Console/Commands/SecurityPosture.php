<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Phase 6: production readiness probe (static config + live checks).
 * Fails loudly on any insecure posture; see SECURITY.md for remediation.
 * Safe to run on a live system (read-only except an optional --verify-audit
 * chain walk, which is also read-only).
 */
class SecurityPosture extends Command
{
    protected $signature = 'security:posture {--verify-audit : Also walk the full audit hash chain}';

    protected $description = 'Check production security posture (config, secrets, transport)';

    public function handle(): int
    {
        $failures = 0;
        $check = function (string $label, bool $ok, string $hint = '') use (&$failures) {
            $this->line(($ok ? '  [OK] ' : '  [FAIL] ') . $label . ($ok || $hint === '' ? '' : " — {$hint}"));
            if (!$ok) {
                $failures++;
            }
        };

        $isProd = app()->isProduction();

        $check('APP_KEY is set', (string) config('app.key') !== '');
        $check('APP_PREVIOUS_KEY is unset (no rotation in flight)', (string) config('app.previous_key', '') === '', 'unset APP_PREVIOUS_KEY after rotation completes');
        $check(
            'APP_DEBUG disabled in production',
            !$isProd || config('app.debug') === false,
            'set APP_DEBUG=false'
        );
        $check(
            'Mock payments driver blocked in production',
            !$isProd || (string) config('payments.driver') !== 'mock',
            'set PAYMENTS_DRIVER to a real driver'
        );
        $check(
            'Stripe webhook secret configured (or driver unused)',
            !$isProd || (string) config('payments.driver') !== 'stripe' || (string) config('payments.stripe.webhook_secret', '') !== '',
            'set PAYMENTS_STRIPE_WEBHOOK_SECRET'
        );
        $check(
            'Paystack webhook secret configured (or driver unused)',
            !$isProd || (string) config('payments.driver') !== 'paystack' || (string) config('payments.paystack.secret', '') !== '',
            'set PAYMENTS_PAYSTACK_SECRET'
        );
        $check(
            'Turnstile bot defence configured',
            (string) config('services.turnstile.secret', '') !== '',
            'set TURNSTILE_SECRET (+ VITE_TURNSTILE_SITE_KEY); auth runs unverified without it'
        );
        $check(
            'Database TLS required in production',
            !$isProd || (string) config('database.connections.pgsql.sslmode') === 'require',
            'set DB_SSLMODE=require with the CA deployed'
        );
        $check(
            'Session cookies secure in production',
            !$isProd || (bool) config('session.secure') === true,
            'set SESSION_SECURE_COOKIE=true'
        );
        $check(
            'Broadcast driver is not log in production',
            !$isProd || (string) config('broadcasting.default') !== 'log',
            'start reverb and set BROADCAST_CONNECTION=reverb'
        );

        try {
            DB::connection()->getPdo();
            $check('Database reachable', true);
        } catch (\Throwable $e) {
            $check('Database reachable', false, substr($e->getMessage(), 0, 120));
        }

        if ((bool) $this->option('verify-audit')) {
            $code = $this->call('audit:verify-chain');
            if ($code !== self::SUCCESS) {
                $failures++;
            }
        }

        $this->line($failures === 0 ? 'security:posture — all checks passed' : "security:posture — {$failures} check(s) FAILED");

        return $failures === 0 ? self::SUCCESS : self::FAILURE;
    }
}
