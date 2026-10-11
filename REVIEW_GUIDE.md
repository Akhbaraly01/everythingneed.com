# EverythingNeed — Review Guide

System re-validated end-to-end on **2026-10-07** (Phase L-A): PHPUnit **1520 passed
(10167 assertions)**, Vitest **40/40**, Playwright **55 passed / 14 skipped** (desktop + mobile + tablet),
live matrices **31 + 26 + 43 = 100 checks, 0 fails**, route/page audits **697 + 260, 0
violations**. Full evidence: `backend/FINAL_VALIDATION_CHECKLIST.md`,
`backend/AUDIT_MATRIX.md`, `TESTING_GUIDE.md`, `docs/LEARN_ARCHITECTURE.md`,
`docs/LEARN_MODERATION_MODEL.md`.

## 1. Start here

One server serves everything (web UI + JSON API):

```bash
cd backend
php artisan serve --host=127.0.0.1 --port=8000
```

| What | URL |
|---|---|
| Home | http://127.0.0.1:8000/ |
| Login | http://127.0.0.1:8000/login |
| Register | http://127.0.0.1:8000/register |
| Health | http://127.0.0.1:8000/up and `/api/health` |

PostgreSQL `127.0.0.1:5432`, dev DB `everythingneed` (137 tables, seeded).
Never run `migrate:fresh` on it. Tests use `everythingneed_test`.

## 2. Accounts (pick one per role)

| Email | Password | Role | Lands on |
|---|---|---|---|
| super@everythingneed.com | `password` | super_admin | /admin/dashboard |
| admin@everythingneed.com | `Password1` | administrator | /admin |
| vendor@everythingneed.com | `Password1` | vendor_admin | /vendor |
| content@everythingneed.com | `Password1` | content_admin | /admin (CMS) |
| healthcare@everythingneed.com | `Password1` | healthcare_admin | /admin |
| support@everythingneed.com | `Password1` | support_staff | /admin |
| learning@everythingneed.com | `Password1` | learning_admin | /admin |
| finance@everythingneed.com | `Password1` | finance_admin | /admin |
| category@everythingneed.com | `password` | category_admin | /admin |
| moderator@everythingneed.com | `password` | moderator | /admin |
| cs@everythingneed.com | `password` | customer_service | /admin |
| daniel.worker@everythingneed.com | `password` | worker | /provider |
| user@everythingneed.com | `Password1` | customer | /dashboard |

Wrong-role URLs redirect safely (guest `/admin/*` → `/login` with an error;
plain customer on `/admin/*` → 302, never a 500 or a blank page).

## 3. Walkthrough by wave (what to click)

- **A — no dead ends**: browse Home, marketplace, footer links. Every link
  resolves; no placeholders, no fake success messages.
- **B — no-code data**: as `admin@`, use the admin Add-forms to create a
  course / restaurant / hotel / property — no code change, visible publicly.
- **C — CMS blocks**: as `content@`, edit CMS blocks and publish a
  data-driven page; open it as a guest.
- **D — navigation + Home**: Home renders its full section lineup; header,
  footer and mobile navigation all work (resize to a phone width).
- **F — Needs lifecycle**: as `user@`, post a need → as `daniel.worker@`,
  make an offer → negotiate → accept → pay → mark fulfilled.
- **G — commerce**: as guest browse `/products` (search + filters work) →
  login as `user@` → cart → checkout → mock payment → order appears in
  account orders → track delivery → leave a review.
- **H — payments**: checkout pay step; drivers are configured in `.env`
  (`PAYMENTS_DRIVER=mock` locally; `stripe|paypal|paystack` in production).
- **I — KYC + wallet**: as `user@`, submit KYC → as `admin@`, approve in
  `/admin/kyc` → wallet top-up and pay-from-balance unlock.
- **J — financial services**: bills module — create/pay a bill as customer.
- **K — healthcare**: `/healthcare` — doctors, availability slots, book an
  appointment; labs list; pharmacy catalog.
- **L — Learn**: `/learn` — enroll in a course, open lessons, track
  progress, take a quiz, earn a certificate.
- **M — account center**: `/dashboard` — profile, security, orders,
  bookings, wallet, notifications, support tickets.
- **N — verticals**: hotels (search/book), food (restaurants/order), real
  estate (listings), rides, jobs.
- **O — messaging/reviews/support**: message threads, notifications bell,
  product reviews, support ticket lifecycle.
- **P — admin control plane**: as `super@`, open `/admin/dashboard`,
  `/admin/users` (38-role roster), `/admin/analytics` (domains + funnel),
  `/admin/audit-logs` (IP + metadata, CSV export), categories SEO/slug
  management.
- **Q — security spot checks**: submit `<script>`-style content in any CMS
  text field → rejected with 422; open a nonsense admin URL → safe
  redirect, never a stack trace; API without token → 401/403 JSON.
- **R — performance**: analytics overview is cached (120s); scheduler runs
  5 commands (`php artisan schedule:list`).
- **S — frontend**: repeat the guest journey at mobile width (devtools
  device toolbar) — layouts adapt, console specs are desktop-only by design.
- **T — backend gaps**: bills, delivery tracking, real-estate detail pages
  all persist and validate.
- **U — end-to-end chains**: healthcare chain, learning chain, wallet
  chain, commerce chain (covered above).
- **V — build/seed/routes**: `backend/route_list.txt` (857 routes),
  `backend/public/build/manifest.json` (fresh deterministic build).
  JS is chunk-split (`app` 40KB + `react-vendor` + `vendor` + `inertia`).
- **W — new in the final waves**: `/admin/audit-logs` rows are written by
  every authenticated mutation (file + DB); tablet 834px viewport covered
  by e2e; bill/need currency inputs normalize case and whitelist 9 ISO
  codes; checkout locks variant rows (no oversell).
- **X — done**: this guide, `docs/implementation/FINAL_IMPLEMENTATION_REPORT.md`,
  `docs/implementation/MASTER_GAP_REGISTER.md`, and the final delivery ZIP.

## 4. Re-run the gates yourself

```bash
cd backend
php artisan test --no-coverage tests/Feature/WaveA   # per-wave suites WaveA..WaveU
npm run lint && npm run typecheck && npm run build
npm run test:e2e                                      # needs the server running
```

Full PHPUnit = 6 sequential chunks (never parallel — shared test DB); the
chunk map is in `FINAL_VALIDATION_CHECKLIST.md`. Live matrices live in
`%TEMP%\opencode\` (`live_matrix.ps1`, `runtime_matrix_p10.ps1`,
`runtime_matrix_p11.ps1`) — run sequentially with ~60s gaps (shared login
throttle).
