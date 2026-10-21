<!DOCTYPE html>
@php
    // Multilingual Phase 0: server-resolved locale (SetLocale/ApplyUserLocale)
    // plus the registry map used by the pre-paint sync script below.
    $__locale = app()->getLocale();
    $__localeDirs = [];
    foreach (app(\Core\Services\Contracts\LanguageRegistryInterface::class)->all() as $__code => $__meta) {
        $__localeDirs[$__code] = ($__meta['dir'] ?? 'ltr') === 'rtl' ? 'rtl' : 'ltr';
    }
    $__dir = $__localeDirs[$__locale] ?? 'ltr';
@endphp
<html lang="{{ str_replace('_', '-', $__locale) }}" dir="{{ $__dir }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    {{-- Browser chrome + iOS home-screen affordances --}}
    <meta name="theme-color" content="#f8fafc" media="(prefers-color-scheme: light)">
    <meta name="theme-color" content="#01050f" media="(prefers-color-scheme: dark)">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="{{ config('app.name', 'EverythingNeed') }}">

    {{-- Whole-page translation (Google widget): warm the connection while
         the page is still parsing so the switch to another language
         starts translating immediately. "auto" resolves to the widget
         whenever no translation provider is configured. --}}
    @php
        $__atEngine = (string) config('auto_translate.engine', 'auto');
        $__atGoogle = $__atEngine === 'google'
            || ($__atEngine === 'auto' && ! app(\Core\Localization\AutoTranslateService::class)->enabled());
    @endphp
    @if ($__atGoogle)
        <link rel="preconnect" href="https://translate.google.com" crossorigin>
        <link rel="preconnect" href="https://www.gstatic.com" crossorigin>
        <link rel="dns-prefetch" href="https://translate-pa.googleapis.com">
    @endif

    {{-- No-flash theme + quality tier. Runs before first paint so dark users
         never see the light card (defect D14 / X1). Keep in sync with
         components/ThemeProvider.tsx and lib/quality.ts. --}}
    <script nonce="{{ Vite::cspNonce() }}">
        (function () {
            try {
                var root = document.documentElement;
                var KEY = 'everythingneed-theme';
                var stored = localStorage.getItem(KEY);
                var theme = (stored === 'dark' || stored === 'light' || stored === 'system') ? stored : 'system';
                var dark = theme === 'dark'
                    || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                root.classList.toggle('dark', dark);
                root.classList.toggle('light', !dark);

                var themeMeta = document.querySelector('meta[name="theme-color"]:not([media])');
                if (!themeMeta) {
                    themeMeta = document.createElement('meta');
                    themeMeta.setAttribute('name', 'theme-color');
                    document.head.appendChild(themeMeta);
                }
                themeMeta.setAttribute('content', dark ? '#01050f' : '#f8fafc');

                // Quality tier: Full / Balanced / Lite (see resources/css/app.css).
                var tier = 'full';
                var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
                    || window.matchMedia('(prefers-reduced-transparency: reduce)').matches;
                var weak = (navigator.deviceMemory && navigator.deviceMemory <= 4)
                    || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)
                    || (navigator.connection && navigator.connection.saveData === true);
                if (reduced) { tier = 'lite'; } else if (weak) { tier = 'balanced'; }
                var savedTier = localStorage.getItem('everythingneed-tier');
                if (savedTier === 'full' || savedTier === 'balanced' || savedTier === 'lite') {
                    tier = savedTier;
                }
                root.setAttribute('data-tier', tier);
            } catch (e) {
                document.documentElement.setAttribute('data-tier', 'full');
            }

            try {
                // Multilingual Phase 0: locale sync. The server already
                // rendered this document with the resolved locale (cookie >
                // account > Accept-Language > default); this restores a
                // guest's local choice that predates the cookie and mirrors
                // it into the `locale` cookie so the next request agrees.
                var LOCALE_DIRS = @json($__localeDirs);
                var LOCALE_KEY = 'everythingneed-language';
                var has = function (value) {
                    return typeof value === 'string'
                        && Object.prototype.hasOwnProperty.call(LOCALE_DIRS, value);
                };
                var stored = null;
                try { stored = localStorage.getItem(LOCALE_KEY); } catch (err) {}
                if (!has(stored)) { stored = null; }
                var cookie = null;
                try {
                    var match = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
                    cookie = match ? decodeURIComponent(match[1]) : null;
                } catch (err) {}
                if (!has(cookie)) { cookie = null; }
                if (!cookie && stored) {
                    try {
                        document.cookie = 'locale=' + encodeURIComponent(stored)
                            + ';path=/;max-age=31536000;samesite=lax';
                    } catch (err) {}
                }
                var chosen = cookie || stored || @json($__locale);
                root.setAttribute('lang', chosen);
                root.setAttribute('dir', LOCALE_DIRS[chosen] || @json($__dir));
            } catch (e) {
                // Locale attributes already set server-side; non-fatal.
            }
        })();
    </script>

    @php
        // Spec 88: server-rendered SEO head for crawlers. Controllers opt in
        // with an `seo` prop (title/description/image/canonical/robots/json_ld);
        // everything else falls back to site defaults so the initial
        // (non-JS) document is always complete: title, description, canonical,
        // Open Graph, Twitter card and structured data.
        $seo = [];
        if (isset($page) && is_array($page['props']['seo'] ?? null)) {
            $seo = $page['props']['seo'];
        }
        $seoTitle = trim((string) ($seo['title'] ?? '')) !== ''
            ? $seo['title']
            : config('app.name', 'EverythingNeed');
        $seoDescription = trim((string) ($seo['description'] ?? '')) !== ''
            ? $seo['description']
            : config('app.name', 'EverythingNeed').' - Your one-stop platform for all needs';
        $seoImage = $seo['image'] ?? null;
        if (is_string($seoImage) && $seoImage !== '' && str_starts_with($seoImage, '/')) {
            $seoImage = url($seoImage);
        }
        $seoCanonical = $seo['canonical'] ?? url()->current();
        $seoRobots = $seo['robots'] ?? 'index,follow';
        $seoType = $seo['type'] ?? 'website';
        $seoJsonLd = is_array($seo['json_ld'] ?? null) ? $seo['json_ld'] : [];
        // NOTE: build inline arrays in @php - Blade's @json splits its
        // argument at the first comma, which truncates literal arrays.
        $websiteJsonLd = [
            '@context' => 'https://schema.org',
            '@type' => 'WebSite',
            'name' => config('app.name', 'EverythingNeed'),
            'url' => url('/'),
        ];
    @endphp

    <title inertia>{{ $seoTitle }}</title>
    <meta name="description" content="{{ $seoDescription }}">
    <meta name="robots" content="{{ $seoRobots }}">
    <link rel="canonical" href="{{ $seoCanonical }}">

    {{-- Open Graph (spec 88) --}}
    <meta property="og:site_name" content="{{ config('app.name', 'EverythingNeed') }}">
    <meta property="og:type" content="{{ $seoType }}">
    <meta property="og:title" content="{{ $seoTitle }}">
    <meta property="og:description" content="{{ $seoDescription }}">
    <meta property="og:url" content="{{ $seoCanonical }}">
    @if (is_string($seoImage) && $seoImage !== '')
        <meta property="og:image" content="{{ $seoImage }}">
    @endif

    {{-- Twitter (spec 88) --}}
    <meta name="twitter:card" content="{{ is_string($seoImage) && $seoImage !== '' ? 'summary_large_image' : 'summary' }}">
    <meta name="twitter:title" content="{{ $seoTitle }}">
    <meta name="twitter:description" content="{{ $seoDescription }}">
    @if (is_string($seoImage) && $seoImage !== '')
        <meta name="twitter:image" content="{{ $seoImage }}">
    @endif

    {{-- Structured data: sitewide WebSite + page-specific blocks (spec 88) --}}
    <script type="application/ld+json" nonce="{{ Vite::cspNonce() }}">@json($websiteJsonLd)</script>
    @foreach ($seoJsonLd as $jsonLdBlock)
        @if (is_array($jsonLdBlock))
            <script type="application/ld+json" nonce="{{ Vite::cspNonce() }}">@json($jsonLdBlock)</script>
        @endif
    @endforeach

    {{-- Fonts --}}
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600,700&display=swap" rel="stylesheet" />

    {{-- Styles / Fonts --}}
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.tsx'])

    @inertiaHead
</head>
<body class="font-sans antialiased">
    @inertia
</body>
</html>
