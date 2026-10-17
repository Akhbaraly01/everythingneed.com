<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class HandleInertiaRequests
{
    public function handle(Request $request, Closure $next): Response
    {
        Inertia::share([
            // Validation errors flashed by ValidationException redirects.
            // Without this the SPA forms (login/register/forgot-password)
            // render no message on failure - the client only surfaces errors
            // that arrive in page props on the redirect follow-up.
            'errors' => function () {
                $bag = session('errors');

                return $bag ? $bag->getBag('default')->toArray() : [];
            },
            'auth' => function () use ($request) {
                if ($user = $request->user()) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        // Alias kept for pages that read auth.user.*
                        'user' => [
                            'id' => $user->id,
                            'name' => $user->name,
                            'email' => $user->email,
                        ],
                        'roles' => $user->roles->pluck('role'),
                        'two_factor_enabled' => (bool) $user->twoFactorSecret?->enabled,
                        // Effective granular permissions, resolved by the single
                        // EffectivePermissionResolver so the console nav
                        // permission field never disagrees with the server
                        // checks. super_admin => ['*'].
                        'permissions' => app(\Core\Services\Contracts\EffectivePermissionResolverInterface::class)->all($user),
                    ];
                }

                return null;
            },
            'workspace' => function () use ($request) {
                if ($user = $request->user()) {
                    return app(\Core\Services\Contracts\WorkspaceResolverInterface::class)
                        ->workspaceFor($user, $request->getPathInfo());
                }

                return null;
            },
            'flash' => function () use ($request) {
                return [
                    'success' => $request->session()->get('success'),
                    'error' => $request->session()->get('error'),
                    'status' => $request->session()->get('status'),
                ];
            },
            'cartCount' => function () use ($request) {
                if (!$request->user()) {
                    return 0;
                }

                $cart = \Modules\Checkout\Entities\Cart::with('items')
                    ->where('user_id', $request->user()->id)
                    ->first();

                return $cart ? (int) $cart->items->sum('quantity') : 0;
            },
            'unreadNotifications' => function () use ($request) {
                if (!$request->user()) {
                    return 0;
                }

                try {
                    return (int) \Illuminate\Support\Facades\DB::table('notifications')
                        ->where('user_id', $request->user()->id)
                        ->where('is_read', false)
                        ->count();
                } catch (\Throwable) {
                    return 0;
                }
            },
            'socialLinks' => config('app.social', []),
            'appLinks' => config('app.store_links', []),
            // DB-driven site menus (spec S46 - no hard-coded navigation).
            // Header/footer/mobile/category/more; empty location lists fall
            // back to the component defaults until an admin seeds them.
            'siteNav' => fn () => app(\Core\Services\Contracts\PublicNavigationInterface::class)
                ->menus($request->user()),
            // Editable system text (no-code UI strings, Settings -> UI Text).
            // Nested (ui -> login_title) so Inertia dot-notation works.
            'uiTexts' => fn () => $this->uiTextsNested(),
            // Display preferences (Settings -> General). Consumed by the
            // frontend currency formatter and language provider. Values
            // are whitelisted here so a tampered setting can never break
            // rendering - unknown values fall back to USD/en.
            'preferences' => fn () => $this->preferences($request),
            'ziggy' => function () use ($request) {
                return [
                    'url' => route('home', [], false),
                    'port' => null,
                    'defaults' => [],
                    'routes' => [],
                ];
            },
        ]);

        return $next($request);
    }

    /**
     * Authenticated display preferences with safe fallbacks.
     *
     * @return array{currency: string, language: string}
     */
    private function preferences(Request $request): array
    {
        $currency = \Core\Support\Currencies::default();
        $language = 'en';

        if ($user = $request->user()) {
            try {
                $stored = \Modules\Settings\Entities\UserSetting::where('user_id', $user->id)
                    ->whereIn('key', ['general.currency', 'general.language'])
                    ->pluck('value', 'key');

                $savedCurrency = strtoupper((string) ($stored['general.currency'] ?? ''));
                if (in_array($savedCurrency, \Core\Support\Currencies::SUPPORTED, true)) {
                    $currency = $savedCurrency;
                }

                $savedLanguage = strtolower((string) ($stored['general.language'] ?? ''));
                if (in_array($savedLanguage, ['en', 'es', 'fr', 'pt', 'de', 'ar', 'zh', 'sw'], true)) {
                    $language = $savedLanguage;
                }
            } catch (\Throwable) {
                // Preferences must never break page rendering.
            }
        }

        return ['currency' => $currency, 'language' => $language];
    }

    /**
     * Flat `ui.*` settings keys -> nested props so Inertia's dot-notation
     * (uiTexts.ui.login_title.value) resolves past the dots in the key.
     *
     * @return array<string, mixed>
     */
    private function uiTextsNested(): array
    {
        $flat = app(\Core\Services\Contracts\UiTextServiceInterface::class)->all();

        $nested = [];
        foreach ($flat as $key => $meta) {
            $segments = explode('.', (string) $key);
            $leaf = array_pop($segments);

            $ref = &$nested;
            foreach ($segments as $segment) {
                if (! isset($ref[$segment]) || ! is_array($ref[$segment])) {
                    $ref[$segment] = [];
                }
                $ref = &$ref[$segment];
            }
            $ref[$leaf] = $meta;
            unset($ref);
        }

        return $nested;
    }
}
