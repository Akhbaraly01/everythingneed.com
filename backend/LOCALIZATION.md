# EverythingNeed — Multilingual System

Two layers cooperate:

1. **Curated dictionaries** (`lang/{locale}/*.php` → versioned JSON → i18next)
   render the UI chrome on first paint and keep key-based copy stable.
2. **Whole-page auto-translation** (`AutoTranslateBridge`) translates
   everything else — DB menus, CMS banners, category/product/job titles,
   user content — immediately after a language selection, Google
   Translate-style.

The old database translation tables, AI draft commands, review queue and
`/admin/languages` console were removed. `config/locales.php` is the only
registry; locale behaviour is controlled by config + env.

## Components

| Layer | Where | Notes |
|---|---|---|
| Registry (config only) | `Core/Localization/LanguageRegistry.php` via `LanguageRegistryInterface` (scoped binding) | Reads `config/locales.php`; per-entry `enabled` / `guest_enabled` flags and `locales.default` control availability. No database. |
| Request resolution | `App\Http\Middleware\SetLocale` (global) + `ApplyUserLocale` (web) | Precedence: `locale` cookie > account preference (`user_settings.general.language`) > Accept-Language > default. Sets request attributes `locale` / `locale.source` (`cookie|user|header|default`), `app()->setLocale()` and Carbon's locale. |
| Selection endpoint | `POST /locale` (`LocaleController`, `throttle:30,1`) | Validates against the registry, sets a plain `locale` cookie (1 year, Lax, Secure when HTTPS) and persists the choice for signed-in users. 422 for disabled/unknown locales. |
| Shared props (Inertia) | `App\Http\Middleware\HandleInertiaRequests` | Shares `locale`, `localeSource`, `fallbackLocale`, `dir`, `availableLocales`, `i18nVersion`, `bootTranslations`, and `autoTranslate {engine, source}`. |
| Pre-paint sync | `resources/views/app.blade.php` inline script | Renders `<html lang dir>` server-side, then mirrors a guest's stored localStorage choice into the cookie before first paint. Inline scripts carry the per-request CSP nonce. |
| Dictionary runtime | `resources/js/lib/i18n-config.ts`, `lib/i18n.tsx` (`LanguageProvider`) | i18next singleton; boot translations are a head start, remaining chunks load from the versioned bundles. `setLanguage()` updates i18next, localStorage, the cookie and `POST /locale`. |
| Whole-page engine | `resources/js/lib/auto-translate/` + `components/i18n/AutoTranslateBridge.tsx` | Mounted once inside `LanguageProvider` in `app.tsx`. Chooses proxy / Google / off from the shared prop and re-applies after React and Inertia updates. |
| Translation proxy | `POST /api/i18n/auto-translate` (`AutoTranslateController` → `AutoTranslateService`) | Chunked, deduplicated, server-cached; provider selected by `config/auto_translate.php`. 503 on outage so the source text stays visible. |
| Language + currency menu | `resources/js/components/i18n/LocaleCurrencySwitcher.tsx` | Alibaba-style single popover: the trigger shows the active combination (`English-USD`), the menu holds two radio groups (language, currency). Accessible (`aria-haspopup`, `menuitemradio`, Arrow/Home/End/Escape). Used by the storefront header. |
| Currency runtime | `resources/js/lib/currency-context.ts` + `lib/currency-provider.tsx` (`CurrencyProvider`) | Owns the display currency (stored amounts stay USD-major). `setCurrency()` persists to localStorage and, for signed-in users, to `general.currency` on the account (`PUT /api/users/{id}/settings`), so every price re-renders in the new currency. |
| Translation progress | `resources/js/lib/auto-translate/state.ts` (`broadcastTranslateState`) | The engine and the widget broadcast `everythingneed:translate-state`; the switcher shows a spinner while the whole page is being converted. |
| Search bar | `resources/js/components/shared/GlobalSearch.tsx` | Marketplace search with combobox semantics (`id="search-words"`, `role="combobox"`, `aria-autocomplete="list"`, grouped `listbox` suggestions), a picture-search button and a search button. |
| Export pipeline | `App\Console\Commands\ExportI18nCommand` (`i18n:export [--check\|--prune\|--path=]`) | Writes `public/i18n/{version}/{locale}/{namespace}.json` + `manifest.json`. `version` is a 12-char sha1 of the content. |
| Formatting | `lib/utils.ts`, `lib/currency.ts` | BCP 47 tags from the registry `intl` column. |

## The `locale` cookie

Plain (not Laravel-encrypted) so client JS can read/write it:
`bootstrap/app.php` calls `$middleware->encryptCookies(except: ['locale'])`.
Client writes mirror the server's: `path=/;max-age=31536000;samesite=lax`.

## Resolution precedence (detailed)

1. `locale` cookie (explicit choice; anonymous and signed-in alike).
   When it conflicts with the account preference it wins, and
   `ApplyUserLocale` syncs the account to the cookie's value.
2. Account preference `user_settings.general.language`.
3. Guest localStorage choice (`everythingneed-language`) — beats an
   implicit server answer (`header`/`default`); the provider pushes it to
   `POST /locale`.
4. `Accept-Language` negotiation when a registry locale matches.
5. `config('locales.default')` (`en`).

An implicit server answer never writes the cookie itself — first visits
must not pin a cookie that would outrank a later stored guest choice.

## Whole-page translation

`config/auto_translate.php` (all env-driven):

```dotenv
AUTO_TRANSLATE_ENGINE=auto         # auto | proxy | google | off
AUTO_TRANSLATE_PROVIDER=libretranslate  # libretranslate | deepl | google
AUTO_TRANSLATE_SOURCE=             # empty = provider auto-detect
AUTO_TRANSLATE_CACHE_TTL=2592000   # seconds
AUTO_TRANSLATE_THROTTLE=120,1      # per-IP requests/minute
LIBRETRANSLATE_URL=                # e.g. https://libretranslate.example.com
LIBRETRANSLATE_API_KEY=
DEEPL_API_KEY=
DEEPL_ENDPOINT=https://api-free.deepl.com
GOOGLE_TRANSLATE_API_KEY=
```

`auto` is the default: it resolves per request to the proxy when the
configured provider has credentials, otherwise to the Google widget. The
selected language therefore always converts the **whole page** (DB menus,
CMS banners, categories, product/job titles), not only the curated UI
strings. Pin `google` for a zero-backend deployment, `proxy` to keep
translation server-side, or `off` to run on dictionaries alone.

### Path B — proxy (provider configured)

Browser (`lib/auto-translate/engine.ts`):

- Walks text nodes and `placeholder`, `aria-label`, `title`, `alt`.
- Skips `script/style/noscript/code/pre/textarea/svg/canvas/iframe`,
  `[translate="no"]`, `[data-no-translate]`, `[data-auto-translate="off"]`,
  `.notranslate`, contenteditable, URLs, domain-like strings, one-character
  strings and strings without letters.
- Batches unseen strings (≤40) to `POST /api/i18n/auto-translate`, caches
  results in memory, and re-applies them when React replaces nodes.
- One batch stays in flight at a time; the request has a 20s timeout, so a
  slow provider can never block the queue.
- Tracks per-node originals: switching back to the source locale restores
  the exact React-rendered text. A generation counter invalidates in-flight
  work after a language switch (results stay cached under their own
  target); a recent-writes set prevents MutationObserver feedback loops.
- Listens to Inertia `router.on('finish')` to rescan after navigation.

Server (`AutoTranslateService`):

- Deduplicates within a request and caches per `(target, source, text)`
  for `AUTO_TRANSLATE_CACHE_TTL` seconds (Laravel cache store).
- Enforces `max_texts` 60 / `max_chars` 6000 / `max_text_length` 1000.
- Providers: `LibreTranslateProvider` (batch, falls back to serial),
  `DeepLProvider` (repeated `text` form fields), `GoogleCloudTranslationProvider`
  (v2 API key). Missing credentials or provider errors → HTTP 503; the
  client silently keeps the source text.
- Only enabled locales (`LanguageRegistry::enabledCode`) are accepted.

The curated dictionary keeps rendering the chrome in the target language;
the provider sees those strings with `source=auto` and returns them
unchanged, so the hand-written translations survive.

Recommended default: self-hosted LibreTranslate (free, no quotas);
DeepL for quality; Google Cloud Translation if already provisioned.
Provider language coverage differs — DeepL does not cover every locale
(e.g. Swahili); the client keeps source text when a provider rejects it.

### Path A — Google Translate Website Widget

`AUTO_TRANSLATE_ENGINE=google` (or `auto` without a configured provider)
loads Google's `element.js`, keeps a hidden
mount slot, hides the banner/tooltip/highlight chrome, and drives the
widget's hidden `<select>` from the combined language/currency switcher;
the `googtrans` cookie makes the choice reload-safe. `SecurityHeaders`
allows `translate.google.com`, `translate.googleapis.com`,
`translate-pa.googleapis.com` and `www.gstatic.com` in `script-src`,
`style-src`, `font-src` and `frame-src` (element.js loads its stylesheet
from gstatic and its language list from translate-pa).

Two rules make the widget behave:

- The dictionary stays in the **source** language in widget mode
  (`I18nBoot.dictionaryLocale`). Translating the chrome first and then
  handing Spanish text to a widget that assumes English would mangle it;
  the widget translates the complete page in one pass instead.
- The `change` event the switcher dispatches must bubble — the widget
  listens on the document. A forced re-translation (reset to the idle
  state, then re-select) runs after each Inertia navigation so freshly
  rendered content is converted too.

Limitations: external dependency + Google branding/quality, and Google
owns the DOM rewriting (custom per-node restore is unavailable). Switching
back to the source locale clears the cookie and reloads if Google had
already translated the document. For full control and offline behaviour,
use Path B.

### Turning it off

`AUTO_TRANSLATE_ENGINE=off` leaves the curated dictionaries in charge.
The proxy route then answers 503 (client no-ops) and the Google script is
never loaded.

## Versioned bundles & CDN

`i18nVersion` is shared to the front end and becomes the fetch prefix
`/i18n/{version}/...`. After changing `lang/**`: run `php artisan i18n:export`
(the sha1 changes) and clear nothing — new URLs bypass caches automatically.
`--prune` deletes old version directories. `public/i18n` is gitignored.

## CSP note

`SecurityHeaders` emits `script-src 'self' 'nonce-...'`; the nonce is also
handed to `Vite::useCspNonce()` so the theme/quality block, the locale
pre-paint block and the JSON-LD blocks execute. Google Translate origins
are additionally allowed for Path A (see `SecurityHeaders`).

## Tests

- `tests/Feature/Localization/` — resolution precedence, endpoint,
  config-only registry, export determinism, blade document attributes.
- `AutoTranslateProxyTest` — dedup + cache, target validation, request
  caps, disabled engine and provider failure (fake provider, no network).
- `tests/Feature/Admin/` — console routes no longer include a language page.
- `e2e/i18n.spec.ts` — rendered locale, pre-paint restore + cookie sync,
  picker switch + reload persistence, currency switch, RTL flip. The
  whole-page assertions follow the resolved engine (dictionary mode
  checks the translated chrome, widget mode checks the `googtrans`
  cookie).
- `resources/js/lib/auto-translate/*.test.ts` — proxy batching/failure
  handling, the DOM engine (skip rules, single-flight batches, restore on
  source switch) and the widget driver (bubbling change event, forced
  re-translation, cookie handling).
- `resources/js/components/i18n/LocaleCurrencySwitcher.test.tsx` — the
  combined menu (trigger label, both radio groups, selection handlers).
- `npm run test:unit` covers the dict helpers and Intl formatters.

## Adding a language

1. Append the locale to `config/locales.php` (`name`, `native`, `intl`,
   `dir`, `flag`; optional `enabled` => false to hide it).
2. Add `lang/{code}/common.php` (all keys; `en` is the fallback matrix).
   Optional when the auto-translator will cover the UI too.
3. `php artisan i18n:export` (bundles are artifacts, not commits).
4. Set `AUTO_TRANSLATE_*` so the provider supports the locale, then pick
   the language in the header menu.
