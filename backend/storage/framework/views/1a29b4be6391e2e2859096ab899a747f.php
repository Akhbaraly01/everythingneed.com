<!DOCTYPE html>
<?php
    // Multilingual Phase 0: server-resolved locale (SetLocale/ApplyUserLocale)
    // plus the registry map used by the pre-paint sync script below.
    $__locale = app()->getLocale();
    $__localeDirs = [];
    foreach (app(\Core\Services\Contracts\LanguageRegistryInterface::class)->all() as $__code => $__meta) {
        $__localeDirs[$__code] = ($__meta['dir'] ?? 'ltr') === 'rtl' ? 'rtl' : 'ltr';
    }
    $__dir = $__localeDirs[$__locale] ?? 'ltr';
?>
<html lang="<?php echo e(str_replace('_', '-', $__locale)); ?>" dir="<?php echo e($__dir); ?>">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="csrf-token" content="<?php echo e(csrf_token()); ?>">

    
    <meta name="theme-color" content="#f8fafc" media="(prefers-color-scheme: light)">
    <meta name="theme-color" content="#01050f" media="(prefers-color-scheme: dark)">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="<?php echo e(config('app.name', 'EverythingNeed')); ?>">

    
    <script nonce="<?php echo e(Vite::cspNonce()); ?>">
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
                var LOCALE_DIRS = <?php echo json_encode($__localeDirs, 15, 512) ?>;
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
                var chosen = cookie || stored || <?php echo json_encode($__locale, 15, 512) ?>;
                root.setAttribute('lang', chosen);
                root.setAttribute('dir', LOCALE_DIRS[chosen] || <?php echo json_encode($__dir, 15, 512) ?>);
            } catch (e) {
                // Locale attributes already set server-side; non-fatal.
            }
        })();
    </script>

    <?php
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
    ?>

    <title inertia><?php echo e($seoTitle); ?></title>
    <meta name="description" content="<?php echo e($seoDescription); ?>">
    <meta name="robots" content="<?php echo e($seoRobots); ?>">
    <link rel="canonical" href="<?php echo e($seoCanonical); ?>">

    
    <meta property="og:site_name" content="<?php echo e(config('app.name', 'EverythingNeed')); ?>">
    <meta property="og:type" content="<?php echo e($seoType); ?>">
    <meta property="og:title" content="<?php echo e($seoTitle); ?>">
    <meta property="og:description" content="<?php echo e($seoDescription); ?>">
    <meta property="og:url" content="<?php echo e($seoCanonical); ?>">
    <?php if(is_string($seoImage) && $seoImage !== ''): ?>
        <meta property="og:image" content="<?php echo e($seoImage); ?>">
    <?php endif; ?>

    
    <meta name="twitter:card" content="<?php echo e(is_string($seoImage) && $seoImage !== '' ? 'summary_large_image' : 'summary'); ?>">
    <meta name="twitter:title" content="<?php echo e($seoTitle); ?>">
    <meta name="twitter:description" content="<?php echo e($seoDescription); ?>">
    <?php if(is_string($seoImage) && $seoImage !== ''): ?>
        <meta name="twitter:image" content="<?php echo e($seoImage); ?>">
    <?php endif; ?>

    
    <script type="application/ld+json" nonce="<?php echo e(Vite::cspNonce()); ?>"><?php echo json_encode($websiteJsonLd, 15, 512) ?></script>
    <?php $__currentLoopData = $seoJsonLd; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $jsonLdBlock): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
        <?php if(is_array($jsonLdBlock)): ?>
            <script type="application/ld+json" nonce="<?php echo e(Vite::cspNonce()); ?>"><?php echo json_encode($jsonLdBlock, 15, 512) ?></script>
        <?php endif; ?>
    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>

    
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600,700&display=swap" rel="stylesheet" />

    
    <?php echo app('Illuminate\Foundation\Vite')->reactRefresh(); ?>
    <?php echo app('Illuminate\Foundation\Vite')(['resources/css/app.css', 'resources/js/app.tsx']); ?>

    <?php $__inertiaSsrResponse = app(\Inertia\Ssr\SsrState::class)->setPage($page)->dispatch();  if ($__inertiaSsrResponse) { echo $__inertiaSsrResponse->head; } ?>
</head>
<body class="font-sans antialiased">
    <?php $__inertiaSsrResponse = app(\Inertia\Ssr\SsrState::class)->setPage($page)->dispatch();  if ($__inertiaSsrResponse) { echo $__inertiaSsrResponse->body; } else { ?><script data-page="app" type="application/json"><?php echo json_encode($page); ?></script><div id="app"></div><?php } ?>
</body>
</html>
<?php /**PATH C:\Users\Lenovo\Desktop\EVERYTHINGNEED\MY PROJECT\everythingneed-com\backend\resources\views/app.blade.php ENDPATH**/ ?>