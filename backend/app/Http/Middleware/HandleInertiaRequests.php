<?php

namespace App\Http\Middleware;

use Closure;
use Core\Localization\BundleManifest;
use Core\Localization\TranslationRepository;
use Core\Services\Contracts\LanguageRegistryInterface;
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
            // Multilingual Phase 0: the locale resolved for this request
            // (cookie -> account -> Accept-Language -> default, by
            // SetLocale/ApplyUserLocale), how it was chosen, direction,
            // the enabled registry for the picker, the export version
            // (cache key for translation bundles), and the boot
            // translations (fallback + active `common`) so the first
            // paint is already translated without a fetch.
            'locale' => fn () => SetLocale::locale($request),
            'localeSource' => fn () => SetLocale::source($request),
            'fallbackLocale' => fn () => app(LanguageRegistryInterface::class)->fallback(),
            'dir' => fn () => app(LanguageRegistryInterface::class)->dir(SetLocale::locale($request)),
            'availableLocales' => fn () => $this->availableLocales(),
            'i18nVersion' => fn () => $this->i18nVersion(),
            'bootTranslations' => fn () => $this->bootTranslations($request),
            // Whole-page translation engine for AutoTranslateBridge:
            // proxy (server provider), google (website widget), or off.
            // `auto` prefers the proxy once a provider is configured and
            // falls back to the widget so the feature works out of the box.
            'autoTranslate' => fn () => [
                'engine' => $this->autoTranslateEngine(),
                'source' => is_string(config('auto_translate.source')) && config('auto_translate.source') !== ''
                    ? config('auto_translate.source')
                    : null,
            ],
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
     * The language here is the fully resolved request locale (validated
     * against the registry by the middleware chain); currency stays
     * whitelisted against Core\Support\Currencies.
     *
     * @return array{currency: string, language: string}
     */
    private function preferences(Request $request): array
    {
        $currency = \Core\Support\Currencies::default();

        if ($user = $request->user()) {
            try {
                $savedCurrency = strtoupper((string) (
                    \Modules\Settings\Entities\UserSetting::where('user_id', $user->id)
                        ->where('key', 'general.currency')
                        ->value('value') ?? ''
                ));

                if (in_array($savedCurrency, \Core\Support\Currencies::SUPPORTED, true)) {
                    $currency = $savedCurrency;
                }
            } catch (\Throwable) {
                // Preferences must never break page rendering.
            }
        }

        return [
            'currency' => $currency,
            'language' => SetLocale::locale($request),
        ];
    }

    /**
     * Enabled locales for the language picker (registry order).
     *
     * @return list<array{code: string, name: string, native: string, dir: string, intl: string, flag: string|null}>
     */
    private function availableLocales(): array
    {
        $locales = [];

        foreach (app(LanguageRegistryInterface::class)->enabled() as $code => $meta) {
            $locales[] = [
                'code' => $code,
                'name' => $meta['name'],
                'native' => $meta['native'],
                'dir' => $meta['dir'],
                'intl' => $meta['intl'],
                'flag' => $meta['flag'],
            ];
        }

        return $locales;
    }

    /**
     * Resolve the effective whole-page translation engine.
     *
     * auto -> proxy when a provider is configured, otherwise the Google
     * widget, so language selection works without server credentials.
     */
    private function autoTranslateEngine(): string
    {
        $engine = (string) config('auto_translate.engine', 'auto');

        if (! in_array($engine, ['auto', 'proxy', 'google', 'off'], true)) {
            return 'off';
        }

        if ($engine !== 'auto') {
            return $engine;
        }

        return app(\Core\Localization\AutoTranslateService::class)->enabled() ? 'proxy' : 'google';
    }

    /**
     * Version stamp of the exported translation bundles
     * (config locales.bundles_path, default public/i18n/manifest.json),
     * used by the client loader as a cache key. Falls back to 'dev'
     * before the first i18n:export ran. No static cache: the manifest
     * can change between requests (export, tests) in one process.
     */
    private function i18nVersion(): string
    {
        return BundleManifest::read()['version'] ?? 'dev';
    }

    /**
     * First-paint dictionary: the fallback locale plus the active locale
     * for the `common` namespace only (the rest loads lazily).
     *
     * @return array<string, array<string, array<string, mixed>>>
     */
    private function bootTranslations(Request $request): array
    {
        $registry = app(LanguageRegistryInterface::class);
        $repository = app(TranslationRepository::class);

        $fallback = $registry->fallback();
        $locale = SetLocale::locale($request);

        $payload = [$fallback => ['common' => $repository->tree($fallback, 'common')]];

        if ($locale !== $fallback) {
            $payload[$locale] = ['common' => $repository->tree($locale, 'common')];
        }

        return $payload;
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
