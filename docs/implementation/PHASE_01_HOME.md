# PHASE 01 — HOME

Status: audit complete; one gap (H-10) implemented below; gate at the bottom.

## Audit (2026-10-13, against §6)

| Area | State | Evidence |
|---|---|---|
| A. Global header | IMPLEMENTED AND VERIFIED | `Marketplace/Header.tsx` (fixed, search, scan, language×8, theme, support, cart, account, desktop nav, mobile menu). Currency lives in Settings by design. |
| B. Hero/discovery | IMPLEMENTED AND VERIFIED | `BannerSlider` (CMS `cms_banners`, autoplay, dots, fallback). |
| C. Find Your Need | IMPLEMENTED AND VERIFIED | `CategoryGrid` 7+More + panel, `NeedCarousel` (API-driven), `/needs/request` entry. |
| D. Discovery rails | IMPLEMENTED AND VERIFIED | 14 DB-driven sections + batches + promos + RV + Recently Added + learn/healthcare cards; empty rails hide, never fabricate. |
| E. Dynamic scroll | IMPLEMENTED AND VERIFIED | `InfiniteProductFeed` (batches, tab filter, `/api/home/feed`, Load More + loader). |
| F. Submit Need entry | IMPLEMENTED AND VERIFIED | PromoCard → `/needs/request` (full workflow = PHASE 02). |
| G. Trust content | IMPLEMENTED AND VERIFIED | Footer CMS links, no fabricated testimonials/stats (grep clean). |
| Admin control | IMPLEMENTED AND VERIFIED | Banners (Cms), sections (HomeSections console), promos (uiTexts), batch size (setting). |
| Responsive Navarro | IMPLEMENTED AND VERIFIED | e2e chromium/mobile/tablet; 27-route zero-overflow sweep. |

## TODOs

- H-01 Architecture + route audit — IMPLEMENTED AND VERIFIED (above).
## H-02 Reference recall (pattern mapping, no live visits claimed)

| Component | Systems recalled (§5.1/5.6 catalogue) | Adapted pattern |
|---|---|---|
| Interleaved rails + grids | Amazon, AliExpress, Temu, Jumia | Product rails with See-all, batch grids, 2-col mobile |
| Icon strip 4+4 + SeeMore | Binance-style dock, Jumia category icons | Fixed order tiles, expandable panel |
| Fixed header + bottom dock | Binance, Temu, Shopee | Persistent chrome, glass orbs, safe-area |
| BannerSlider | Temu/Lazada campaign carousels | Autoplay, dots, CMS-managed, fallback |
| NeedCarousel ×2 | Thumbtack, TaskRabbit request cards | Single `/api/need-categories` source, both instances |
| SearchTabs pills | Amazon/YouTube filter chips | Type filter driving feed, no duplicate search |
| RecentlyViewed | Amazon/YouTube history rails | localStorage trail, compact strip |
| TripleBanner "Trending Items" | Shopee/Lazada promo triptychs | Auto-rotating trending + promo tiles |
| Experts carousel | Fiverr/Upwork pro cards | 2-up mobile slider, dots, View All |
| Need promo / banners | Thumbtack CTAs, GoFundMe honesty | uiTexts copy, real destinations only |

Limitation: catalogue-level mapping from known patterns; no live browsing
session run. Single-site [URL] clone tasks remain available on request.
- H-03 Navigation + responsive — IMPLEMENTED AND VERIFIED.
- H-04 Layout + design system — IMPLEMENTED AND VERIFIED (space-y-5 rhythm,
  glass tokens, screenshots on file).
- H-05 Search + discovery — IMPLEMENTED AND VERIFIED (header search +
  pills; in-page duplicate deleted by design).
- H-06 Category navigation — IMPLEMENTED AND VERIFIED.
- H-07 Collections + View More — IMPLEMENTED AND VERIFIED.
- H-08 CMS + admin — IMPLEMENTED AND VERIFIED.
- H-09 Real data/perf — IMPLEMENTED AND VERIFIED (server props, paginate,
  chunk-split; no response cache on `/` — documented, not a defect).
- H-10 SEO metadata — IMPLEMENTED AND VERIFIED (this phase: `seo` prop +
  `SeoMeta`, crawler head via `app.blade.php`, test below).
- H-11 States (loading/empty/error/mobile) — IMPLEMENTED AND VERIFIED.
- H-12 Tests + regression — IMPLEMENTED AND VERIFIED (see gate).

## H-10 implementation

- `HomePageController::marketplaceData()` gains `seo` (title, honest
  description of real verticals, canonical `url('/')`, `index,follow`).
  No stats, no fabricated claims. Dashboard shares the payload; crawlers
  never reach it (auth), so no change there.
- `Home/Index.tsx` accepts `seo` and renders shared `SeoMeta` (reuse-first:
  no duplicate head component).
- Test: `home props carry seo metadata` in
  `tests/Feature/Admin/HomeSectionManagementTest.php`.

## Acceptance gate

- [x] Every §6 area audited with status above.
- [x] Single gap (H-10) implemented, tested, green.
- [x] No dead destinations (271/271 targets, 0 dead links — re-verified).
- [x] Regression: WaveD home suite + marketplace e2e green (below).

## Re-verification (programme execution, this session)

- `tests/Feature/WaveD` + `HomeFeedTest` + `HomeSectionManagementTest`:
  **29 passed**.
- `e2e/marketplace.spec.ts` chromium **13 passed**, mobile **13 passed**
  (order, banners→RV, icons, language switch, refresh-to-top, fixed chrome).
- H-02 recall register recorded above (catalogue mapping, limitation noted).

**TRACK A GATE: CLOSED.**
