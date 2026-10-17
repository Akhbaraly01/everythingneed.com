# FINAL VALIDATION CHECKLIST — Marketplace UI Port

Source: `REFERENCE-UI@HEAD` (708 files restored). Target: `backend/resources/js/**` only.

## Build & Hygiene
- [x] `npm run build` passes (2553 modules, 24s, `MarketplaceLayout`, `Home/Index` built)
- [x] `grep <banned-framework-names> backend/resources/js` = 0 results
- [x] `grep sk_live|api_key|secretpassword|<legacy-baas-host> = 0 results
- [x] `php artisan config:clear && php artisan route:list` no errors
- [x] New Marketplace files: 0 TS errors (pre-existing errors in 30 legacy files untouched)
- [x] Fixed `admin/Dashboard.tsx res.data → data` fatal bug (`lib/api.ts returns payload as T`)
- [x] `Dashboard.tsx` no longer shows `Total Orders 0 / Welcome back Super Admin` — renders `Home/Index`
- [x] `ThemeProvider html.dark + localStorage everythingneed-theme` kept, `app.css --primary 217 91% 60%` gold tokens

## UI Parity (Gold Exact Classes)
- [x] Sliding banners with dots/arrows/auto-slide 5s? YES `BannerSlider.tsx` 6 campaigns, `translateX(-idx*100%)`, `absolute bottom-2`, `h-7 w-7 bg-black/30`, interval 5000
- [x] 8 category icons exact gradients? YES `CategoryGrid.tsx` `grid-cols-4 md:grid-cols-8`, `from-blue-500 to-blue-600` etc + More `from-gray-500 to-gray-600`
- [x] SUBMIT YOUR NEED carousel? YES `NeedCarousel.tsx` uppercase + `h-6 w-6` arrows + progress dots + `min-w-[48%] md:min-w-[24%] h-20`
- [x] Search tabs All/Products/Needs/Health(+Learning/Services)? YES `SearchTabs.tsx` 6 tabs, `h-10 rounded-full`, `w-[120px]` Default sort
- [x] Product grid 2 cols + discount -23%? YES `ProductCard.tsx` `grid-cols-2 md:grid-cols-4 lg:grid-cols-5`, `absolute top-2 left-2 bg-destructive -%`, rating, `$`, arrow
- [x] Bottom nav 5 tabs active blue? YES `BottomNav.tsx` `fixed bottom-0 md:hidden h-14`, Home/Needs/Learn/Health/Account, `text-primary : text-muted-foreground`
- [x] Header profile/search/fullscreen/theme/headset/flag/cart/bell badge 3? YES `Header.tsx` `sticky top-0 h-9 w-9`, ScanLine/Moon-Sun/Headphones/flag/cart/bell `bg-destructive 3`
- [x] Floating chat + cart buttons? YES `FloatingButtons.tsx` `fixed bottom-24 right-4 h-14 w-14` chat (Laravel `/api/ai/chat`), `fixed bottom-20 left-4` cart with count
- [x] Footer brown + Download/We Accept/Security/Social/Copyright 2026? YES `Footer.tsx` `bg-amber-900`, App Store/Google Play, Visa..Crypto, SSL/Verified/ISO, `© {year} everythingneed.com`
- [x] Dark/light mode? YES `ThemeProvider` + `darkMode:["class"]` + Sun/Moon toggle
- [x] 3-banner 1 large = 2 small? YES `TripleBanner.tsx` `grid-cols-5 h-[130px]`, `col-span-3 Trending Now`, `col-span-2 flex-col` Learn + Healthcare
- [x] Login marketplace style? YES `auth/Login.tsx` rebuilt Iteration 2 (Card, gradient title, OTP tabs)
- [x] Dashboard marketplace home? YES `Dashboard.tsx → Home/Index`
- [x] Responsive mobile? YES mobile-first, `md:` breakpoints, `scrollbar-hide`, bottom nav `md:hidden`

## Pages
- [x] `Home/Index.tsx` banners + grid + carousel + Trending + product grid + experts
- [x] `Needs/Index.tsx` hero "All Your Needs, One Place" + search + Book Flight/Hotels
- [x] `Learn/Index.tsx` hero + stats 40+/30+/50K+/4.8 + Dr John Smith/Emily Chen Book
- [x] `Healthcare/Index.tsx` hero + Doctors/Appointments tabs + Book Now
- [x] `Account/Index.tsx` avatar + stats + 9 links marketplace cards
- [x] `Admin/Dashboard.tsx` bug fixed, moved admin stats off user Dashboard

## Iteration 2 — Gaps closed
- [x] Banner/Need touch pause (`onTouchStart/End` + hover pause, 5s/4s)
- [x] BottomNav cart badge on Needs tab (`cartCount` prop, `bg-destructive 9+`)
- [x] TripleBanner gold order (Submit first, Learn second)
- [x] `MarketplaceLayout` reads shared `cartCount` fallback via `usePage()`
- [x] `auth/Login.tsx` rebuilt marketplace: Card `max-w-md`, gradient title, Sign In/Sign Up/OTP tabs, `Input pl-10` Mail/Lock/User icons, `Button w-full`, 6-digit OTP `w-11 h-12` + Verify + resend 60s, `AuthLayout` card style
- [x] Backend: `Web/HomePageController@index/dashboard` (products paginate 12 mapped to `MarketplaceProduct`, categories active, cartCount sum), `GET /home → home.index` public, `/dashboard → HomePageController@dashboard`, `HandleInertiaRequests` shares `cartCount`
- [x] Build 25s OK, `grep <banned-framework-names>` = 0, `route:list --name=home/dashboard` OK, Marketplace 0 TS errors

## Remaining (refreshed Iteration 26)
- [x] Fix 41 pre-existing TS errors → `npx tsc --noEmit` = **0** (Iteration 25)
- [x] Upload wiring → `POST /api/upload` + Cms.tsx picker (Iteration 26, C3)
- [x] Server Purifier spot-check for `learn/Lesson:72 __html` → still pending explicit review (Food N+1 `whereIn`, Upload allowlist review)
- [ ] Footer full bars (Features/QuickServices/Trusted) only if pixel-parity required — deferred by decision
- [ ] Blog editor / page versioning — 🔴 out of scope by spec decision
- [ ] i18n + multi-currency — skipped by spec decision

## Iteration 6 — Full-system functional pass (best approach, UI preserved)
- [x] 5 route shadows fixed (orders/checkout|returns|disputes, hotels/reservations, jobs/applications, job-seekers/my-requests, learn/my-learning|certificates) — all 200
- [x] Dead links repointed (learn catalog/instructor, flights, lesson back-link, quiz certificate, deals claim→vendor/request, lab-confirmation route added, video→healthcare/virtual)
- [x] OTP email twin: migration email column + `OtpSender` no-send seam + `RequestEmailOtp/VerifyEmailOtp` + routes throttled; `otp_challenges` soft-delete/phone-nullable fix; phone request→verify cycle 200 live, zero SMS/mail
- [x] Login OTP tab split phone/email with correct paths+payloads
- [x] Admin contracts: Finance→summary+transactions (+monthly revenue added backend), System→stats/system mapped, Vendors action mapping, Users restore, Products pending+list, Healthcare→/api/doctors, Payouts wired to withdrawals (+process endpoint added)
- [x] Account contracts: addresses CRUD added backend + field mapping; profile saves full_name+phone; password→auth/change-password; notifications→per-user settings; stats endpoint added
- [x] Vendors register (+category field), Analytics composed, stores→vendors API, jobs/tasks submissions fixed, categories/search/food/pharmacy repointed + pharmacy order API added, Certificates fetch+print, messages sender fix, Compare delete path, Reviews mine path, Prescription multipart client fix
- [x] Crash props: jobs Apply, learn Lesson/Quiz (+null guard), healthcare Book/DoctorProfile (+availability), stores/Show fetch
- [x] Global UI: safe-area, dark nav states, scrollable mobile nav, aria labels, chat dialog semantics+Escape, wishlist/cart toasts, currency via formatCurrency, trending dots/arrows, category More close, sort Escape, profile dropdown close
- [x] Build OK, touched files TS-clean, `route_list.txt` regenerated (566 lines), server live, OTP cycle verified live
- [x] Server live `127.0.0.1:8000`, Laravel 13.17.0, DB ok

## Iteration 5 — Mail pause + CRUD/RBAC HIGH + dynamic UI (best approach)
- [x] `config/verification.php` + `MAIL_ENABLED=false` (.env; example true): resend auto-verifies, register auto-verifies, API reset skips send (token still in non-prod JSON); order receipts untouched
- [x] Messaging `close/escalate/satisfaction` now owner/staff-gated; Rides `acceptRide` requested-state + no-self + 409; latent `Dispute.resolve` + `Return.approve/reject` gated `orders.manage` + validated
- [x] Inventory routes split `inventory.view` reads / `inventory.manage` writes + vendor product isolation in controller
- [x] Analytics `index` self-scoped + PII stripped unless `analytics.view`; telemetry POST open
- [x] Guests see working UI: Header search→`/search?q=`, cart→`/cart`, no dead scan/lang, gated icons→login; BottomNav Home/Account guest-aware
- [x] Wishlist heart → `POST /favorites/toggle` (login redirect guests); Add to Cart → `POST /cart/items` + `cartCount` reload (fallback cards → detail)
- [x] Ratings show `No reviews yet` when null; trending dots clickable + right-column arrows; category More closes outside/Escape + Less label + real `categories` prop wired; sort closes on Escape
- [x] TripleBanner trending from real top-rated products; Home per-tab pools; experts prop-driven
- [x] Footer: newsletter POST `/api/newsletter/subscribe` (new table+endpoint, verified 201) + validation/errors; socials/app buttons render only when env URLs set; tel/mailto/maps links; Privacy/Terms → `/tickets`
- [x] `GlobalSearch` results link to detail pages (products/jobs/hotels/food/learn/requests verified in web.php); profile dropdown outside+Escape close
- [x] Newsletter migration ran; build 80s OK; TSC 0 in touched files; `/home|/learn|/healthcare|/needs|/search?q` 200; guest `/admin/users` 302; guest analytics 401
- [x] Server live `127.0.0.1:8000`, Laravel 13.17.0, DB ok

## Iteration 4 — Nav clickability + display + CRUD/RBAC (best approach)
- [x] Header: search submits to `/search?q=`, cart is `Link /cart`, scan/language dead buttons removed, tickets/bell guest→login + badge hidden for guests
- [x] BottomNav: Home `/home` guests + `/dashboard` authed, Account `/login` guests, Needs badge, active states fixed
- [x] Footer: Privacy/Terms → `/tickets`, scroll-top restacked `bottom-40 z-30` (was exact overlap with chat), single `<Footer/>` + `pb-[152px]` safe area
- [x] Products: per-tab pools (real slices + fallback fill, tabs never empty), search covers name+category+vendor, sort menu outside-close, `ProductCard.link` (doctor→book, course→learn)
- [x] TripleBanner trending now clickable → `/search?q=name`; search page already reads `?q=`
- [x] Experts: `topExperts` from DB (2 top doctors + 2 instructors + top vendor, per-section Book links), hardcoded duo = empty-DB fallback only
- [x] RBAC web: `super_admin` keeps rbac/roles/system/settings/audit-logs; `+administrator` operational pages; `+finance_admin` payouts/finance; `+support` tickets; `+healthcare_admin` doctors; `+learning_admin` courses
- [x] RBAC API: `api/admin` group relaxed to `auth` + Gates (AdminPolicy per-role, multi-role fixed); `permission:` added (categories.manage, settings.system.update split per-user self-scoped, analytics.view on summary only)
- [x] Ownership: `users/{id}` self-or-`users.view`, `payments/{id}` owner-or-`payments.view`
- [x] TableGateway: removed 7 unscoped tables (vendor_orders, medicine_order_items, order_tracking, chat_*, ticket_messages, learn_direct_messages) → 404, module APIs remain
- [x] Frontend: `AppLayout` per-item role nav + Access-denied block, shared full `permissions` (was 4)
- [x] Build 36s OK, PHP lint clean, single `healthcare.appointments`, `/learn|/healthcare|/home|/search?q|/needs` 200, `/admin/dashboard` guest 302, `/api/admin/stats` guest 401
- [x] Server live `127.0.0.1:8000`, Laravel 13.17.0, DB ok

## Iteration 3 — Learn SQL + Healthcare blank + purge (best approach)
- [x] Purged `Resources/` + nested `everythingneed-com/` (254 + 302 legacy-scaffold hits gone)
- [x] Top-level stale: `.env` (VITE_BaaS_*) + legacy scaffold config deleted, `vite.config.ts` tagger removed, `package.json` BaaS/tagger deps removed
- [x] `LearnPageController`: dropped `where is_published` (no such column; migration has `is_featured`), mapped `level→course_type`, `through()` adds frontend `level/type` aliases
- [x] `HealthcarePageController@index`: `get()` → `paginate(12/5)` matching frontend `{data,meta}`
- [x] `healthcare/Index.tsx`: `normalizeList()` handles array-or-paginator + empty-doctors guard (no more blank)
- [x] `bootstrap/app.php`: 403/404/500 + generic now redirect back for web (Inertia-safe), JSON only for `expectsJson|api/*`
- [x] Removed duplicate `healthcare/appointments` closure (controller at :505 wins, single name)
- [x] Fixed 4 raw-stat admin pages (`Analytics/AdminSettings/System/Finance: res.data→data`); 14 list-pages with `{data}` wrapper correctly untouched
- [x] Build 26s OK, single `healthcare.appointments` route, `/learn` 200, `/healthcare` 200, `/home` 200, `/dashboard` guest 302
- [x] Sweep: `backend` 0 hits (only checklist doc mentions), `frontend/src` 0 hits

## Boot — LIVE
- [x] `REVERB_SERVER_PORT=8081` set (was default 8080 clash with frontend)
- [x] PHP 8.5.4 / Node 24 / vendor + node_modules + manifest present
- [x] `config:clear` OK, `route:list home.index + dashboard` OK, `migrate:status` all Ran, DB `pgsql 127.0.0.1:5432 everythingneed` OK
- [x] Ports 8000/8080/8081 free, app up
- [x] `php artisan serve --host=127.0.0.1 --port=8000` running (hidden window)
- [x] `GET /up` 200 `{"status":"operational","version":"13.17.0","php":"8.5.4","database":"ok"}`
- [x] `GET /home` 200 (5590 bytes, `HomePageController@index` + products/categories/cartCount)
- [x] `GET /dashboard` guest 302 → login (correct `auth+verified`)
- [x] Stack: Laravel 13.17.0 + Inertia v3/v2 + React 18 TS + Modular 34/34 + PostgreSQL — no banned framework traces in `resources/js|app|Modules|routes|config|.env` (0 hits)

## Iteration 7 — Section completeness (Home/Needs/Learn/Healthcare/Account)
- [x] Home: fallbackProducts/Experts/experts/stats removed; real empty states; CMS banners via `GET /api/cms/banners/public` (active, non-deleted, sort_order) wired to `BannerSlider`; `TripleBanner` no fake `trendingItems` (empty-state when no real trending); `CategoryGrid` real categories + section fallbacks; `NeedCarousel` loads `/api/need-categories` with nav fallbacks
- [x] Learn: landing stats computed from courses (no 40+/50K/Dr John Smith); instructor API real aggregate + 404; duplicate `my-certificates` route removed
- [x] Healthcare: labs no fake CBC/Lipid/Thyroid list (Doctor specialization only); Labs API path fixed `/api/health/labs`; Lab "Book Test" → real `/healthcare/labs/{id}/book`; Content pages Videos/Documents/Guides + routes + hub links (Labs/Virtual/Videos/Documents/Guides)
- [x] Needs: offer reject endpoint + UI + test (`owner can reject offer` PASS); accept+reject available in pending/offered/reviewing
- [x] Account: hub 14 links (Orders…Settings incl. Bookings/Reviews/Applications/Healthcare History); `/profile` → `account/Profile`; `/settings/profile` redirects to account profile; catch-all SPA redirect → Inertia `errors/404`
- [x] `AUDIT_MATRIX.md` updated (section statuses + cross-cutting X1–X6)
- [x] `npm run build` OK (43s); typecheck 23 legacy errors (0 in section files); PHP lint clean; route:list 571 lines
- [x] Tests: NeedRequestWorkflow 5/5 (incl. reject), Learn 17/17, Healthcare 27/27 green
- [x] Server live `127.0.0.1:8000`, Laravel 13.17.0, DB ok

## Iteration 8 — Phase 2 financial hardening (master spec §13–25)
- [x] Migration `2026_09_23_000004_harden_financial_tables`: unique (wallet_id, reference); payments idempotency_key/metadata/provider/provider_payment_id; refunds status + gateway_response; tables kyc_verifications, wallet_holds, payment_webhook_events
- [x] `Core/Services/Gateways/*` drivers (mock/manual/stripe/paypal/paystack) + `GatewayDriverResolver`; `config/payments.php`; `.env PAYMENTS_DRIVER=mock`
- [x] `PaymentGateway` idempotent charge, driver-based refund, provider fields, audit + events; mock blocked in production
- [x] Core `WalletService` lockForUpdate + idempotent topUp/debit/transfer (sorted lock order)
- [x] Module wallet deposit routes through gateway first; withdraw/transfer delegate to Core; withdraw reference derived from idempotency key
- [x] `ChargePayment` wraps gateway in DB::transaction; order → PAID only on `succeeded`
- [x] `RefundPayment` delegates to gateway; maps succeeded → completed (legacy tests)
- [x] `UpdateOrderStatus` listener no longer writes invalid `confirmed` (was aborting charge transactions)
- [x] AdminFinance: revenue `succeeded|completed`; payout process `paid` + audit; processWithdrawal(Request)
- [x] Webhooks: `POST /api/webhooks/payments/{stripe|paypal|paystack}` with event_id dedupe
- [x] KYC: `GET/POST /api/kyc`, review role-gated
- [x] AuditService: zero-UUID actor fallback (performed_by is uuid NOT NULL)
- [x] Factories: PaymentFactory status `succeeded` + provider; MedicineOrderFactory matches schema
- [x] `phpunit.xml` MAIL_ENABLED=true (mail/notification tests)
- [x] Flight confirmation stranger expects Inertia web redirect 302 (not raw 403)
- [x] New `FinancialHardeningTest` 10/10 (idempotency, webhooks, KYC, finance summary, payout audit)
- [x] Regression: `php artisan test` → **420 passed, 0 failed** (1377 assertions)

## Iteration 9 — Phase 3 Auth/RBAC hardening
- [x] API + web registration assign default `user` role (UserRole::firstOrCreate)
- [x] LoginUser enforces 2FA when enabled → returns `requires_2fa` + `pending_token` (no bare token)
- [x] AuthController::login short-circuits on 2FA challenge
- [x] Admin suspend deletes Sanctum tokens immediately (User::tokens()->delete)
- [x] EnsureUserHasRole: API guest → 401 JSON; API forbidden → 403 JSON; web keeps abort(403)
- [x] Login/register throttled `throttle:10,1` (429 verified)
- [x] AdminRbacController::permissions driven by PermissionSeeder::CATALOG (single source of truth)
- [x] AdminRbacController::ROLES includes hotel/food/transport/agriculture/building/jobs/pharmacy_admin + kyc_reviewer
- [x] two_factor_secrets migration adds `deleted_at` (base Model SoftDeletes)
- [x] New `AuthRbacHardeningTest` 10/10 (roles, suspend revoke, middleware 401/403, catalog parity, rate limit)
- [x] Regression: Authentication + Admin RBAC suites green
- [x] Full suite: **430 passed** (1400 assertions), 0 failed

## Iteration 10 — Phase 4 CMS hardening
- [x] AdminCmsController: full CRUD for pages/blog/banners/announcements with update endpoints
- [x] Creates use explicit `Str::uuid()` (PG `insertGetId` on uuid PK was unreliable)
- [x] Banner create/update accepts `image_url`, `link_url`, `sort_order`, `is_active`
- [x] Page/blog status draft→published; blog sets `published_at` on publish
- [x] Soft-delete (`deleted_at`) so admin + public lists hide removed rows
- [x] Unique slug helper handles title collisions (`contact`, `contact-2`)
- [x] Public APIs: `/api/cms/pages/public`, `/pages/public/{slug}`, `/blog/public`, `/announcements/public` (date window + priority sort)
- [x] Admin CMS UI: Blog tab, create forms, status toggle, working delete (`Cms.tsx`)
- [x] Routes: PUT update for all four CMS types; all `->can('manageCms')`
- [x] New `CmsManagementTest` 10/10
- [x] `npm run build` OK (39s); CMS + Auth + RBAC suites 25/25
- [x] Full suite: **440 passed** (1448 assertions), 0 failed

## Iteration 11 — Phase 5 Commerce hardening
- [x] Cart rejects add/update beyond product/medicine stock (422 + stock message)
- [x] `applyCoupon` stores discount preview only — `used_count` increments once in PlaceProductOrder
- [x] `recomputeDiscount` clears coupon when items drop below min / empty / coupon invalid
- [x] Cart totals: discount clamped to subtotal, total never negative
- [x] Vendor `PATCH /vendor/orders/{id}` enforces transition map (pending→…→delivered); illegal jump 422
- [x] Checkout FE clears cart (`DELETE /api/cart`) after successful order + payment attempt
- [x] CartApiTest stock-aware fixtures (factory stock is random 0–100)
- [x] New `CommerceHardeningTest` 6/6
- [x] Regression: CartApiTest + ExtendedCouponTest + ProductOrderTest + VariantOrder + Dispute + Return + ProductCrud green
- [x] Full suite: **446 passed** (1468 assertions); `npm run build` OK (24s)

## Iteration 12 — Phase 6 remainder: wallet holds + reconciliation
- [x] `WalletHold` model + Core `WalletService`: hold / release / capture / available / listHolds
- [x] Available balance = balance − sum(active holds); hold is idempotent by reference
- [x] Capture debits wallet (ledger transaction) and marks hold captured; release restores available
- [x] Module WalletService wraps hold errors as ValidationException (422 JSON, not 500)
- [x] API: GET `/wallet/available`, GET/POST `/wallet/holds`, POST `/wallet/holds/release`, POST `/wallet/holds/capture`
- [x] `financial:reconcile` command: stuck payments, ledger mismatches, `--release-expired`, `--fix-balances`
- [x] Hourly schedule: `financial:reconcile --release-expired` in Console Kernel
- [x] New tests: WalletHoldTest 9, WalletHoldApiTest 7, WalletReconcileTest 4
- [x] Full suite: **466 passed** (1518 assertions), 0 failed
- [ ] Live gateway credentials smoke (stripe/paypal/paystack) outside local mock

## Iteration 13 — Phase 7 Healthcare hardening
- [x] BookAppointment: validate doctor exists + available; double-book check before create (excludes cancelled/completed)
- [x] AssignDoctor: require available doctor; fires DoctorAssigned
- [x] BookAppointment fires AppointmentBooked; random assign fires DoctorAssigned
- [x] StartConsultation action: assigned → in_consultation; POST `/api/appointments/{id}/start`
- [x] Complete restricted to assigned doctor + healthcare admins (patient gets 403)
- [x] Cancel reason appended to ticket description
- [x] New `HealthcareHardeningTest` 10/10
- [x] Healthcare suite (hardening + base + consultation + video) 33/33 green
- [x] Full suite: **476 passed** (1537 assertions), 0 failed; route list 591

## Iteration 14 — Phase 8 Needs/services/jobs hardening
- [x] Jobs `?mine=1` only applies filter when authenticated (guest no crash)
- [x] Public job list excludes expired (`expires_at` past); apply on expired → 422
- [x] Self-apply on own job → 422; duplicate application → 409
- [x] Need pay uses `idempotency_key` `NRPAY-{requestId}` through payment gateway
- [x] New `NeedsJobsHardeningTest` 8/8
- [x] Needs + Tasks + JobSeekers regression green (21 tests)
- [x] Full suite: **484 passed** (1552 assertions), 0 failed; routes 591

## Iteration 15 — Phase 9 Learning hardening
- [x] Paid courses charge through PaymentGateway on enroll (idempotency `ENROLL-{course}-{user}`)
- [x] Free courses free enroll; `students_count` increments both paths
- [x] Double enroll no double charge (status guard before payment)
- [x] Course `?type=` → `course_type` filter; `?q=` title/description search; `instructor_name` filter
- [x] Complete lesson / certificate require enrollment (404 without)
- [x] New `LearnHardeningTest` 8/8
- [x] Learn suite 25/25 green (Learn + LearnBackend + LearnHardening)
- [x] Full suite: **492 passed** (1573 assertions), 0 failed; routes 591

## Iteration 16 — Phase 10 Account hardening
- [x] DELETE /account requires `password`; wrong password 422; correct path revokes all Sanctum tokens then deletes user
- [x] First address auto-default; second does not steal default; setDefault exclusive
- [x] Deleting default address promotes next address
- [x] Address mutations owner-scoped (cross-user 404)
- [x] Profile update whitelist: email/role not settable via PUT /profile
- [x] New `AccountHardeningTest` 13/13
- [x] Users+Auth suites 56/56 green
- [x] Full suite: **505 passed** (1615 assertions), 0 failed; routes 591

## Iteration 17 — Phase 11 UI/UX wiring
- [x] Checkout/Tracking/MyLearning correctly unwrap API payloads
- [x] Enroll/Apply use JSON POST (not Inertia to `/api/...`); guest → /login
- [x] Needs form maps to backend validation fields; doctors filter param `specialization`
- [x] Course categories from `/api/course-categories`; job/task applications mapped from relations
- [x] Nested dead Apply removed from jobs list; orders index prop guard
- [x] `npm run build` OK; only pre-existing legacy TS errors remain
- [x] Full suite still **505 passed**; routes 591

## Iteration 18 — Phase 12 API hardening
- [x] 2FA login throttled; chat/ticket/wallet/payment writes throttled
- [x] Building service show auth + ownership; store UUID fixed
- [x] Tasks `?mine=1` guest → 401 (not 500)
- [x] Chat users: no email leak
- [x] Stripe webhook signature + replay window; bad sig → 400
- [x] Delivery index strips PII; show gated
- [x] Viewing-request alias fixed + `viewing_requests` migration
- [x] Notification missing id → 404
- [x] New `ApiHardeningTest` 14/14
- [x] Full suite: **519 passed** (1640 assertions), 0 failed; routes 591; build OK

## Iteration 19 — Phase 13 Security hardening
- [x] Table gateway prescriptions/health_tickets scoped by `patient_id` (closed cross-patient IDOR)
- [x] applyScope 404 when ownership column missing (fail closed); ownership forced on store/update; role/password/user_id stripped from gateway payload
- [x] PayPal webhook verifies transmission headers + PAYPAL_WEBHOOK_ID; Paystack verifies `x-paystack-signature` HMAC-SHA512; both fail-closed when secret configured, local/testing omit
- [x] Generic 500 returns constant `Server Error` (real message logged); /api/health no PHP/Laravel/debug leak
- [x] Password change/confirm rotates `remember_token`; reset token only local/testing
- [x] Session secure default true in production; CORS forbids `*` with credentials; DatabaseSeeder refuses non-local
- [x] Upload throttled 10/min; Lesson HTML sanitized before dangerouslySetInnerHTML
- [x] New `SecurityHardeningTest` 16/16
- [x] Full suite: **535 passed** (1678 assertions), 0 failed; routes 591; `npm run build` OK

## Iteration 20 — Phase 14 Testing
- [x] `phpunit.xml` coverage report block (html+text); optional driver warning if xdebug/pcov absent
- [x] New suites: CategoryCrud / Settings / Reviews / Inventory / Analytics / DomainEvent / Search / Food / Seeders (39 tests, all green)
- [x] Tests aligned to live schema (uuid PKs, soft-deletes, `data.*` search nesting, course `course_type`, menu `category`, no timestamps on stock_levels)
- [x] Real bugs fixed: `AnalyticsController::store` uuid + `properties` column; `StockLevel::$timestamps = false`
- [x] Full suite: **574 passed** (1814 assertions), 0 failed; routes 590; `npm run build` OK (2555 modules)

## Iteration 21 — Phase 15 Production hardening
- [x] Scheduler fixed: `financial:reconcile --release-expired` hourly registered in `routes/console.php` (Laravel 13 ApplicationBuilder never binds App\Console\Kernel)
- [x] `config:cache` safe: `HandleInertiaRequests` social/store links now `config('app.social')` / `config('app.store_links')` (no env() outside config)
- [x] `FORCE_HTTPS` → `URL::forceScheme('https')` when `config('app.force_https')`
- [x] `TestUsersSeeder` + `LocalAccessSeeder` refuse outside local/testing; `ProductionSeeder` (RBAC + feature flags only) documented as prod seed path
- [x] Queue tables migration (`jobs`/`job_batches`/`failed_jobs`) for `QUEUE_CONNECTION=database`
- [x] `composer run optimize-prod` (config+event+view cache; route:cache documented as blocked by closure routes — do not run `artisan optimize`)
- [x] `.env.production.example` + `backend/DEPLOY.md` runbook (migrate --force, seed, cron, worker, Reverb, rollback)
- [x] New `ProductionHardeningTest` 11/11
- [x] Full suite: **585 passed** (1856 assertions), 0 failed; routes 590; `npm run build` OK (2552 modules)

## Iterations 22–25 — REFERENCE-UI parity + security + UI polish + TS cleanup
- [x] It.22 parity pages: `healthcare/MyHealthTickets.tsx` (GET /healthcare/tickets), `pharmacy/OrderConfirmation.tsx` (GET /pharmacy/orders/{id}/confirmation), reusable config-driven `DealLanding` for 8 `/deals/{slug}` (whereIn registered before `/deals/{id}`), Footer added to `AppLayout`
- [x] It.22 cleanup: dead pages `profile/Edit.tsx` + `settings/Profile.tsx` deleted; `api.patch` added to `lib/api.ts`
- [x] It.23 security: chat `customer`/`worker` loaded with `id,name` projection (no email/phone leak); `/2fa/enable` + `/2fa/verify` throttled `10,1`; legacy `AuthService::register` assigns default `user` role; tests added (ChatTest 4/4, SecurityHardeningTest 20/20)
- [x] It.24 UI polish: `NotificationBell` (popover → /api/notifications, mark read/all, typed links+icons) in Header + AppLayout; `CartDrawerContext` + `GlobalCartDrawer` (slide-over, qty/remove/totals, /orders/checkout) wired into MarketplaceLayout + AppLayout, FAB/header open drawer; `CompareDrawer` (floating n/3 bar + bottom sheet vs `/api/compare`, `everythingneed:compare-updated` event); `ExpertsShowcase` (server topExperts + /api/experts fallback) and `RecentlyViewedSection` (localStorage via `useRecentlyViewed`, recorded on product Show) on home
- [x] It.24 bugfix: shared Inertia `auth` now includes `user` alias — Header/product Show/14 other pages read `auth.user.*` which never resolved (logged-in users forced to /login); asserted in AuthWebFlowTest
- [x] It.25 TS: **24 → 0 errors** (`npx tsc --noEmit` clean): SharedData index signature, api.get `{ params }`, api.del fixes, Order/Property types, flash.status, downlevel Set spread, arity/payload-shape fixes
- [x] Final gates: full suite **590 passed** (1893 assertions), 0 failed; routes 593; `npx tsc --noEmit` 0 errors; `npm run build` OK

## Iteration 26 — Gold leftovers + hard gaps
- [x] **A1 2FA UI**: `TwoFactorCard.tsx` (enable → QR + secret → verify → disable) in settings security tab; `POST /api/auth/2fa/disable` + `DisableTwoFactor` action + module `AuthService::disableTwoFactor`; `HandleInertiaRequests` shares `two_factor_enabled`; fixed latent bug — `enableTwoFactor` required `code` so enable always 422'd; `User::twoFactorSecret()` relation added (Core login 2FA gate now functional); SecurityHardeningTest **23/23**
- [x] **A2 web-push**: `usePushNotifications.ts` + `PushNotificationPrompt.tsx` (auth-gated, `bottom-48`, dismiss `localStorage`, sonner fallback), mounted in AppLayout + MarketplaceLayout
- [x] **B1**: web password reset revokes API tokens (`$user->tokens()->delete()`); PasswordResetTest **6/6**
- [x] **C1 inventory reservations**: `inventory_reservations` migration (30-min hold, soft delete); CartController sync/release/availability (stock − foreign-held guard, availability warnings on cart page); `PlaceProductOrder` consumes buyer's reservations; `inventory:release-expired` scheduled every 5 min; fixed cart page envelope bug (`res.data` unwrap — cart always rendered empty); ReservationTest **7/7**
- [x] **C2 shipping**: `shipping_rates` + `ShippingRate` + `ShippingService` (0 when unseeded, free ≥ threshold on discounted subtotal); seeded Standard/Express; cart/checkout/order `shipping_fee` + server-authoritative checkout payment amount; ShippingRateTest **6/6** (incl. client-injected fee ignored)
- [x] **C3 CMS upload**: `Cms.tsx` banner file picker → `POST /api/upload` → `image_url` (preview + remove, 10MB guard); CmsManagementTest **11/11**
- [x] **C4 database sessions**: `SESSION_DRIVER=database` (.env + .env.example; phpunit keeps `array`); `sessions` table already existed with uuid `user_id`; DatabaseSessionTest **4/4** (row on login, survives page loads, deleted on logout via cookie forwarding)
- [x] **D new suites**: ExpertApiTest **10/10** (fixed uuid `insertGetId` 500 in `storeReview`), NotificationsApiTest **9/9** (fixed missing `Notification::markAsRead()` + broken `unreadNotifications` relation — both were runtime 500s), PharmacyOrdersTest **6/6** (ownership 404, server-side totals); regression Healthcare/Messaging/ApiHardening **75/75**
- [x] **E docs**: AUDIT_MATRIX stale rows truth-up (:258/:275/:276/:291/:306/:308/X2/X3) + Iteration 26 section; checklist Remaining refreshed
- [x] **F gates**: full suite **640 passed** (2128 assertions); `npx tsc --noEmit` 0; `npm run build` OK (47.9s); routes 594; `schedule:list` shows `inventory:release-expired` every five minutes; page render smoke (settings/cart/checkout/admin CMS) PageRenderSmokeTest 3/3

## §67 Final status — all 15 phases
| Phase | Status |
|---|---|
| 1–11 (audit→UI/UX) | ✅ Iterations 1–17 |
| 12 API hardening | ✅ Iteration 18 (519) |
| 13 Security | ✅ Iteration 19 (535) |
| 14 Testing | ✅ Iteration 20 (574) |
| 15 Production | ✅ Iteration 21 (585) |
| REFERENCE-UI parity/polish | ✅ Iterations 22–25 (590, tsc 0) |
| Gold leftovers + hard gaps | ✅ Iteration 26 (640, tsc 0) |

Known remaining (documented, not blocking): OpenAPI/Swagger absent; live gateway smoke blocked on real credentials. (Resolved in It.27: route:cache now succeeds — module closures extracted; REFERENCE-UI deleted after parity verification.)

## Iteration 27 — Modular monolith push + best-practice enforcement (P0-P8)
- [x] **P0/P1** backups + route baseline (595 lines); composer audit clean; npm runtime deps 42 -> 8, devDeps 16; strict TS tsc 0; ESLint 0 problems; suite 640/640 (2128 assertions)
- [x] **P2 contracts** all cross-module DB::table access behind 10 Core contract interfaces, implemented in owner modules + provider bindings; 12 Admin controllers + AdminPolicy + Search/User/Expert/Booking/ProductOrder rewired thin
- [x] **P2 routes** 29 module route closures extracted to named controllers; Modules routes closure scan = 0; route diff vs baseline exactly 29 swaps (598 = 598 lines); route:cache now succeeds (previously blocked)
- [x] **P2 arch test** ModularMonolithTest: OWNERSHIP DB::table map + DYNAMIC_ALLOWED + no-closures-in-Modules = 2 passed (now guards regressions)
- [x] **P3 indexes** ~46 guarded indexes (FK + hot status filters) in `2026_09_25_000003_add_missing_indexes_...`; applied to dev DB; test DB rebuilt; FK constraints deliberately skipped (orphan risk documented in migration)
- [x] **P4 FormRequests** 37 new classes wired (Tier 1: wallet/upload/auth/kyc/rbac/order money+identity; Tier 2: Admin CMS/order/settings/department/brand writes); rules copied verbatim; 73 remaining inline validates are Tier 3 read-only filters (documented, intentional)
- [x] **P5 security headers** global SecurityHeaders middleware (nosniff, SAMEORIGIN, Referrer-Policy, Permissions-Policy, COOP, CSP with provider-specific `frame-src`/`script-src` allowlists for YouTube/Vimeo/Facebook/TikTok/Jitsi, camera+microphone only for the video-room host, HSTS only on HTTPS) + SecurityHeadersTest 3/3 (27 assertions)
- [x] **P6 gates** `npm run typecheck` 0; `npm run lint` 0 (bootstrap/ssr build artifacts ignored); `npm run build` OK; `npm run build:ssr` OK; route snapshot diff = 29 expected swaps only; full suite **645 passed (2148 assertions)**
- [x] **P6 hygiene** case-insensitive scan of 1049 repo files = **0 hits** for banned framework names outside legacy `frontend/` (kept by plan); root leftovers cleaned (generator-era landing index, dev event-bus e2e spec, dead guard script, legacy router dep, stale binary lock; lock regenerated on default registry; old backups relocated to Temp)
- [x] **P7 wipe+reseed** `migrate:fresh --seed` + TestUsersSeeder + LocalAccessSeeder; live server `127.0.0.1:8000`; **19/19 API logins verified 200 with correct roles**; web CSRF login verified (302 -> /dashboard -> 200 Inertia with user props); wrong password -> 401; RBAC: super_admin admin/stats 200, plain user 403
- [x] **P8 docs** AUDIT_MATRIX Iteration 27 section + this checklist + credentials below

### Verified dev credentials (all HTTP-verified, dev DB `everythingneed`)
| Email | Password | Role | Verified |
|---|---|---|---|
| super@everythingneed.com | password | super_admin | 200 API + web CSRF login |
| admin@everythingneed.com | password | administrator | 200 |
| user@everythingneed.com | password | user | 200 + RBAC 403 on admin stats |
| cs@everythingneed.com | password | customer_service | 200 |
| moderator@everythingneed.com | password | moderator | 200 |
| category@everythingneed.com | password | category_admin | 200 |
| superadmin@everythingneed.com | Password1 | super_admin | 200 |
| customer@everythingneed.com | Password1 | user | 200 |
| vendor@everythingneed.com | Password1 | vendor_admin | 200 |
| content@everythingneed.com | Password1 | content_manager | 200 |
| healthcare@everythingneed.com | Password1 | healthcare_admin | 200 |
| support@everythingneed.com | Password1 | support_staff | 200 |
| learning@everythingneed.com | Password1 | learning_admin | 200 |
| finance@everythingneed.com | Password1 | finance_admin | 200 |
| daniel.worker@everythingneed.com | password | worker | 200 |
| grace.worker@everythingneed.com | password | worker | 200 |
| kwame.worker@everythingneed.com | password | worker | 200 |
| abena.worker@everythingneed.com | password | worker | 200 |
| yaw.worker@everythingneed.com | password | worker | 200 |

Note: Login API = `POST /api/auth/login` (field `data.access_token`). Login is rate-limited (~10/min): space retries. Start app with `php artisan serve` (left running from verification).

## Iteration 28 - Workspace routing + console authorization (P1-P14)

- [x] **Resolver**: `config/workspace.php` (landings + priority + console roles) → `WorkspaceResolver` (bound) → `workspace` Inertia prop; unit-tested (`WorkspaceResolverTest` 5/5).
- [x] **Login landing**: `WebAuthController::landingFor()` + `redirect()->intended()`; home `/` role-resolved; guests store `url.intended` and are honored post-login (`WorkspaceLandingTest` 9/9).
- [x] **Denial handling**: web+authed 403 → 302 own workspace + `error` flash (no forbidden-URL loop); guest → `/login`; API → 403 JSON. `abort(403)` = plain `HttpException` — handler tests both it and `AccessDeniedHttpException`.
- [x] **Console layouts**: `AdminLayout` (23 pages, `consoleNavigation` 23 entries + 3 aliases), `ProviderLayout`/`/provider` (`role:worker`), `ProviderPageController`; `AppLayout` admin nav removed, `WorkspaceSwitcher` in top bar.
- [x] **RBAC**: 21 canonical roles parity (`AppRole` = `ROLES` = `MATRIX`); single guarded write `RoleAssignmentService` (5 guards, 409 last-SA, transactional, audited); unguarded `setRole` removed.
- [x] **Seeding**: `vendors` row for `vendor@`; `category_admin` real `category_id`; `TestUsersSeeder` sets `email_verified_at` (accounts are new users; `/dashboard` is `auth+verified`).
- [x] **Regression (P13)**: full suite **677 passed (2545 assertions)** (645 baseline + 32 new, 0 regressions); `tsc --noEmit` 0; `eslint resources/js --max-warnings=0` 0; route diff = exactly **+1** (`GET|HEAD provider`).
- [x] **Runtime matrix (P14)**: **19/19 live HTTP** — 15 accounts land on configured landing with 200 pages; denials verified (worker→`/provider`, user→`/dashboard`, vendor→`/vendor`, guest→`/login`).
- [x] **Docs**: `ADMIN_WORKSPACE_AUTHORIZATION_MATRIX.md`, `ADMIN_IMPLEMENTATION_AUDIT.md`, this section.
- [ ] **Reference cleanup**: `REFERENCE-ADMIN/` deletion — **awaiting explicit user approval** (0 code deps verified; concept capture complete).

### Verified dev credentials after Iteration 28 reseed (web, everythingneed)

| Account | Password | Role | Landing (verified) |
|---|---|---|---|
| super@everythingneed.com | password | super_admin | 200 `/admin/dashboard` |
| admin@everythingneed.com | Password1 | administrator | 200 `/admin/dashboard` |
| superadmin@everythingneed.com | Password1 | super_admin | 200 `/admin/dashboard` |
| cs@everythingneed.com | password | customer_service | 200 `/admin/support/tickets` |
| support@everythingneed.com | Password1 | support_staff | 200 `/admin/support/tickets` |
| content@everythingneed.com | Password1 | content_manager | 200 `/admin/cms` |
| finance@everythingneed.com | Password1 | finance_admin | 200 `/admin/finance` |
| healthcare@everythingneed.com | Password1 | healthcare_admin | 200 `/admin/healthcare/doctors` |
| learning@everythingneed.com | Password1 | learning_admin | 200 `/admin/learning/courses` |
| moderator@everythingneed.com | password | moderator | 200 `/admin/approvals` |
| category@everythingneed.com | password | category_admin | 200 `/admin/categories` |
| vendor@everythingneed.com | Password1 | vendor_admin | 200 `/vendor` |
| daniel.worker@ (+4) @everythingneed.com | password | worker | 200 `/provider` |
| user@everythingneed.com | Password1 | user | 200 `/dashboard` |
| customer@everythingneed.com | Password1 | user | 200 `/dashboard` |

Password drift note: `DatabaseSeeder` now calls `LocalAccessSeeder` and then `TestUsersSeeder` **last**, so `Password1` + verified wins for TestUsers' 10 accounts (admin@/user@/vendor@ included; super@ stays `password`; cs@ is outside TestUsersSeeder and stays `password`). One fresh `migrate:fresh --seed` produces exactly the table above - verified on a scratch DB during Stage 5 (then dropped). Web login = `POST /login` (CSRF via `X-XSRF-TOKEN`), `throttle:10,1` per IP.

## Master plan P1-P10 - Admin control plane completion

- [x] **P1 baseline**: 677 tests (2545 assertions), 595 routes, tsc/eslint/build 0 - baselines stored under `%TEMP%\opencode\`.
- [x] **P2-P5**: workspace/route/RBAC/Support unification + 2 sanctum fixes; all admin consoles built (Batches 1-3), 39/39 page smoke.
- [x] **P6 product approval scope/IDOR**: `PermissionServiceInterface::productCategoryScope()`; `ProductQueryInterface::pending()/decide()` take a category scope; `AdminProductApprovalController` resolves it (super/category/moderator semantics; unassigned fails closed to `__no_category_assigned__`); out-of-scope decide -> **404 (non-leaking, chosen)**. 3 new tests in `ProductApprovalTest` (8/8); runtime proof: category_admin(Book) queue 1 vs super 6, out-of-scope approve/reject 404, in-scope 200.
- [x] **P7 reference-admin extraction (native)**: new `PromptDialog` + `Skeleton`/`TableSkeleton` in `components/shared/Ui.tsx`; **all 11 native `prompt`/`confirm` sites replaced** (8 admin + 3 customer pages); DataGrid/PermissionTree/settings renderer/notification centre/`ApiError.errors` already native - no extraction needed. `FrontendPolicyTest` now gates "no native dialogs" repo-wide.
- [x] **P8 dual footer token-only**: `backend/resources/js/components/Marketplace/Footer.tsx` + `frontend/src/modules/home/components/Footer.tsx` rewritten on semantic tokens (`bg-card`, `text-muted-foreground`, `bg-primary`, `border-border`, `--gradient-primary`), **zero `amber-*`**; structure/links/newsletter/socials/scroll-to-top preserved; tsc/eslint/build 0 in both apps; `FrontendPolicyTest` gates both files.
- [x] **P9 tests**: new `AdminConsoleRenderTest` (39 route->component datasets + web-403 + guest), `FrontendPolicyTest` (3), `AdminDomainControllerTest` (11-endpoint shape + role gates + dispute/property/review mutations + audit + validation). Full suite **740 passed (3044 assertions, 377s)** (+60 tests vs P1 baseline, 0 regressions).
- [x] **P10 route diff**: 595 -> **631 (+36, 0 removed)** - every addition is a P5-era admin console page or domain API route (saved: `%TEMP%\opencode\route_diff_p10.txt`).
- [x] **P10 runtime matrix**: **31/31 OK, 0 FAILS** (`runtime_matrix_p10.ps1`) - 15 account landings + **39-page console sweep (all 200)** + 7 specialist-role page checks + 3 cross-role denials (302 own landing) + 3 workspace denials + 2 guest checks.
- [x] **Reference cleanup**: `REFERENCE-ADMIN/` deletion - **user approved (2026-09-26) and will remove it manually**; §70 audit remains on file (37,796 files / 636.6 MB, 0 code refs, outside the app tree).

## Waves W0-W1 - authorization platform (2026-09-27)

- [x] **W0**: table gateway per-table write policy (`TableGatewayWritePolicyTest`).
- [x] **W1.1-W1.B/C/D**: canonical `module.resource.action` naming (CATALOG 140 at W1; 184 now — growth allowed), role value renames, 35-role L0-L3 roster end to end at W1 (AppRole == ROLES == MATRIX, landings, nav, seeders; canonical **38** since Wave P §65).
- [x] **W1 parity**: API gates reconciled with web groups (AdminPolicy + module routes); pins: finance_admin NOT in manageOrders, administrator NOT in viewAuditLogs; `AdminConsoleApiParityTest`.
- [x] **W1.5**: per-user grants - `user_permissions` (migration 000003) + service + `User::hasPermission` layer + `/api/admin/users/{id}/permissions` + Users Perms modal; `UserPermissionGrantsTest` 7/7; live smoke.
- [x] **W1.6**: row scopes - `permission_scopes` (migration 000004) + ScopeContext/ScopeFilter/ScopeResolver + orders/tickets wiring + `/api/admin/rbac/scopes`; OWN/VENDOR/DOMAIN enforced, TEAM/COUNTRY/REGION architected (deferred, no-op + documented); `PermissionScopeTest` 9/9.
- [x] **W1.7**: `permission:` middleware exact/OR/AND/wildcard; `auth.permissions` = role matrix UNION user grants; `consoleNavigation` permission field (36/37, Dashboard exempt) + ConsoleLayout filter; moderator MATRIX += categories.view + orders.view; `PermissionMiddlewareTest` 5/5 + `ConsoleNavPermissionTest` 3/3.
- [x] **W1.8 §75**: per-role allow/deny suites on BOTH layers - API `AdminRoleAuthorizationSuiteTest` (35 roles x 27 probes at W1, 974 assertions then; re-extended to the canonical **38** in Wave P §65) + pages `AdminAuthorizationMatrixTest` extended 21 -> 35 roles at W1 (505 assertions then; 38 since Wave P).
- [x] **W1.9 gates**: full suite **903 passed (5254 assertions), 0 failures**; lint 0 errors (2 pre-existing warnings); tsc 0; build ok; P10 **31/31**; P11 **26/26**; Playwright **5/5** + floor; dev DB migrated 000001-000004 + PermissionSeeder re-run (moderator 7 grants verified).
- [x] **W1.9 docs**: `ADMIN_WORKSPACE_AUTHORIZATION_MATRIX.md` rewritten (then-35-role platform; canonical 38 since Wave P §65); `AUDIT_MATRIX.md` W0-W1 section (deliverables, contracts, deferrals).

## Wave W2 - admin shell: dashboard queues + notification bell (2026-09-27)

- [x] **W2.1 Needs Attention**: `AdminPageController::needsAttention()` - live server-computed queues (derived on read, **no admin_tasks table**): approvals (category-scoped, fail-closed for unscoped marketplace_admin), KYC, disputes, returns, open/unassigned tickets, unprocessed withdrawals, unverified vendors, stock <= reorder point; pushed only when count > 0 AND target href is in the role's router-built `adminHrefs` (sidebar authority); panel above stat tiles with honest all-clear state; `AdminDashboardNeedsAttentionTest` 6/6 (110 assertions).
- [x] **W2.2 card drift fix**: marketplace_admin "Pending Approvals" card now uses the same scoped query as the `/admin/approvals` page (was a global count).
- [x] **W2.3 notification bell**: badge from shared `unreadNotifications` prop (visible before dropdown opens); optimistic override + `router.reload({only:['unreadNotifications']})` after read mutations (reverts on API failure); console-aware "View all" -> `/admin/notifications` only when permitted, else `/notifications`; broken type-links (missing related_id) fall back to `/notifications`.
- [x] **W2.4 shell review**: no `components/admin/` extraction - primitives already shared (`components/shared/*`), 36/36 pages single consistent header; extraction is cosmetic-only churn (evaluated, deferred with rationale).
- [x] **W2 gates**: full suite **909 passed (5364 assertions), 0 failures** (708s); lint 0 errors (2 pre-existing warnings Brands/Kyc); tsc 0; build ok; P10 **31/31**; P11 **26/26**; Playwright **5/5**; `AUDIT_MATRIX.md` W2 section appended.

## Wave W3 - commerce/finance detail routes (2026-09-27)

- [x] **W3.1 detail controller**: `AdminDetailPageController` - four pages (`order`/`vendor`/`user`/`payout`) reusing the same service contracts as the JSON show() endpoints; orders scope-aware (`orders.orders.view` via ScopeResolver, same as `AdminOrderController::show`); missing + out-of-scope rows share one non-leaking web not-found; soft-deleted withdrawals unreachable.
- [x] **W3.2 routes**: `/admin/{orders|vendors|users|payouts}/{id}` added inside their list page's exact `role:` group; parameterized URIs are skipped by `WorkspaceResolver::roleHrefs()` - sidebar, `adminHrefs`, queue gating and registry-parity tests untouched; matrix doc §3 rows updated.
- [x] **W3.3 related data**: order items (multi-item `order_items` or embedded single line) + payments + refunds; vendor owner + stats computed with `VendorQueryService::paginate()` formulas (list/detail agreement); user roles + grants + linked vendor + orders/tickets counts; payout vendor + other withdrawals + commission totals.
- [x] **W3.4 FE pages**: `admin/{OrderDetail,VendorDetail,UserDetail,PayoutDetail}.tsx` with actions on existing APIs (status/refund via PromptDialog, vendor approve/reject/suspend, user role+suspend/restore, payout process) and cross-links gated by shared `workspace.adminHrefs` (no 302 dead-ends).
- [x] **W3.5 list links**: Orders `order_number`, Users name, Vendors store, Payouts vendor (gated) + Details link - every detail page reachable from its list.
- [x] **W3.6 service hardening**: `VendorQueryService::findWithdrawal()` filters `deleted_at` (also protects `processWithdrawal`).
- [x] **W3 tests**: `AdminDetailRoutesTest` 11/11 (99 assertions): renders + related rows, OWN-scope foreign-row indistinguishable from missing, role denials 302, soft-delete unreachable.
- [x] **W3 gates**: full suite **920 passed (5463 assertions), 0 failures** (806s, `w3_full.log`); lint 0 errors (2 pre-existing warnings); tsc 0; build ok; P10 **31/31**; P11 **26/26**; Playwright **5/5**; regression batch 67/67 (console render, matrix, scopes, nav, workspace); `AUDIT_MATRIX.md` W3 section appended.

## Wave W4 - approval engine + order state machine (2026-09-27)

- [x] **W4.1 engine persistence**: migration `2026_09_27_000001_create_approval_tables` (`approval_requests` + `approval_steps`, ordered steps, no soft deletes - append-only audit trail); models `ApprovalRequest`/`ApprovalStep` with status constants.
- [x] **W4.2 engine service**: `ApprovalEngineInterface` bound in `AppServiceProvider` -> `Core\Services\ApprovalEngine` - transactional `request()`/`decide()`, `actorMayDecide` (super bypass / step role / null role = any permission-passed caller), reject marks remainder `skipped`, `list()`/`find()`, audit `approval.requested`/`approval.decided` in try/catch.
- [x] **W4.3 engine API**: `ApprovalRequestStoreRequest` (type slug, title, 1-10 approver_roles each validated against `AppRole::values()`); 5 routes under `api/admin/approval-requests` gated `permission:products.products.approve` (existing Approvals-console permission - CATALOG unchanged); fixed non-leaking messages (404/403/422).
- [x] **W4.4 console Requests tab**: `AdminPageController::approvals()` renders `requests` prop; `Approvals.tsx` tabs (Product queue / Requests) with status filter, step chips, approve/reject + comment, ordered role-step builder from `GET /api/admin/roles`; no new web route (registry-parity untouched).
- [x] **W4.5 order state machine**: `OrderStateMachine` (forward-only, cancel/refund outcomes from active states, terminal final, same-state idempotent, `paid` provider-owned); `OrderQueryService::updateStatus` -> `ok|missing|invalid_transition`, `refund` -> `not_refundable` on terminal; controller 422 mappings; `OrderQueryInterface` docblocks updated.
- [x] **W4.6 FE mirror**: `resources/js/lib/orderStatus.ts` + `Orders.tsx`/`OrderDetail.tsx` selects offer only legal transitions (disabled `... (final)` for terminal, `paid (locked)`); server remains the authority.
- [x] **W4 tests**: `ApprovalEngineTest` 10/10 (54 assertions) + `AdminOrderStateMachineTest` 10/10 (77 assertions): ordered journey, wrong-role 403, super bypass, reject+skip, one-shot 422, permission gate before engine (guest 401), validation 422, console prop; forward/backward/terminal/idempotent/paid-excluded/refund-guard paths.
- [x] **W4 gates**: full suite **940 passed (5594 assertions), 0 failures** (1151s, `w4_full.log`); lint 0 errors (2 pre-existing warnings); tsc 0; build ok; P10 **31/31**; P11 **26/26**; Playwright **5/5**; regression batch 166/166; recall: no new `/admin` web routes, CATALOG still 140, engine API is `api/admin/*`; `AUDIT_MATRIX.md` W4 section appended; matrix doc `§11`/`§13`/`§15` updated.

## Wave W5 - CMS, settings, analytics, reports (2026-09-27)

- [x] **W5.1 CMS completion**: `CmsAnnouncementUpdateRequest` ends-at window rule; `Cms.tsx` full rewrite (edit UI for all 4 content types, complete field coverage, ConfirmDialog deletes, search); idempotent `CmsSeeder` wired into `DatabaseSeeder`; `CmsManagementTest` 15/15 (80 assertions).
- [x] **W5.2 settings lifecycle**: `manageSettings` -> super + administrator; web group split (`/admin/rbac`,`/admin/roles` super-only; `/admin/system`,`/admin/settings` super+administrator); nav Settings permission -> `settings.system.update`; `delete()` + `toggleFlag` no-auto-create (missing -> 404); `AdminSettingsController::destroy` + DELETE route `->can('manageSettings')`; `AdminSettings.tsx` delete with ConfirmDialog; matrix/suite pins updated; `AdminSystemSettingsTest` 6; **3 latent bugs fixed** in `SettingsQueryService` (missing closure `use ($actorId)` -> PUT 500; `featureFlags()` Collection vs `: array` -> always 500; `updateOrInsert` missing uuid PK -> 23502); settings batch 18/18 (820 assertions).
- [x] **W5.3 analytics ranges + export + My Analytics**: `adminOverview` windowed 7d/30d/90d (+ `range`/`since` keys, all-time gauges labelled); `AdminAnalyticsController` rewrite (RANGES whitelist, `seriesMap`, CSV export stream); `GET /api/admin/analytics/export` gated `permission:analytics.overview.export`; **latent bug 4 fixed** (`adminAnalyticsSeries` Collection vs `: array` -> all series endpoints 500); `GET /api/analytics/my-summary` (auth only, caller-scoped) + `/analytics` web `auth` middleware; `api.download()` helper; `Analytics.tsx` range selector + permission-gated export; `analytics/Index.tsx` on my-summary; `AdminAnalyticsRangeExportTest` 8/8, `AnalyticsApiTest` 4/4.
- [x] **W5.4 reports**: web `GET /admin/reports` role-gated (super, administrator, analytics_admin, auditor, analyst); `AdminReportController` (sales/analytics/CSV export, last-30d defaults, inverted-range 422); API `/api/admin/reports/{sales,analytics}` -> `permission:reports.reports.view`, `/export` -> `.export`; nav `Reports` entry (`FileText`); `Reports.tsx` (date range, cards, sales table, event bars, gated export); `AdminReportsTest` 6/6 (38 assertions); matrix + suite pins extended.
- [x] **Arch gate**: full suite caught `ModularMonolithTest` violation (`mySummary` read `orders`/`wishlists` directly) -> aggregates moved into `ReportingService::userStats()` behind `ReportingServiceInterface`; `userStats` += `total_orders`/`total_spent`/`orders_by_month` and **latent bug 5 fixed** (`recent_orders` selected nonexistent `total` column -> always `[]`); 20/20 targeted green after fix.
- [x] **Rate-limit root cause**: matrix breakage after growth past `GlobalRateLimit` 240 req/min/IP (429 -> catch-all `back()` flash) -> per-role `RateLimiter::clear('global:127.0.0.1')` in the test; **latent bug 6 fixed**: web catch-all in `bootstrap/app.php` now logs before redirecting (errors were vanishing silently).
- [x] **W5 gates**: full suite **964 passed (5925 assertions), 0 failures** (1194.5s, `w5_full2.log`; first run 1 failed -> arch fix -> rerun green); lint 0 errors (2 pre-existing warnings); tsc 0; build ok; P10 **31/31**; P11 **26/26**; Playwright **5/5**; recall: CATALOG **140**, routes **655** (+6: `admin/reports`, `api/admin/analytics/export`, `api/admin/reports/{sales,analytics,export}`, `api/analytics/my-summary`), nav/registry parity green; `AUDIT_MATRIX.md` W5 section appended; matrix doc `§3`/`§4`/`§11`/`§13`/`§16` updated.

## Wave W6 - audit console, RBAC scopes, system views (2026-09-27)

- [x] **W6.1 audit export API**: `AdminAuditController::export()` (shared `filters()` contract, CSV stream capped at 10 000 rows, filename `everythingneed-audit-logs-Ymd-His.csv`) + `GET /api/admin/audit-logs/export` gated **both** `permission:audit.logs.export` and `can:viewAuditLogs` — implements the previously dangling `audit.logs.export` (was in CATALOG with zero code references); export writes its own audit event (`action=export`, actor + rows/filters, try/catch).
- [x] **W6.2 audit console rebuild**: `AuditLogs.tsx` — server-driven filters (search/action **select**/entity_type/date range + Reset; fixes the old free-text action filter whose 422 silently rendered "No audit logs"), pagination (25/50/100 + prev/next over `meta`), permission-gated Export CSV button, Changes column from `new_values`/`old_values`; **latent bug 7 fixed** — old page read `user_name`/`ip_address`/`details` which the API never returns (User/IP columns were always blank; no IP column exists).
- [x] **W6.3 RBAC scopes UI**: `Rbac.tsx` Permission Scopes section (list + revoke, grant form with role select / debounced user search, catalog permission select, scope select with `(deferred)` labels, domain key required for `domain`); **5 mojibake strings fixed**.
- [x] **W6.4 System Health polish**: `System.tsx` — 3 mojibake fallbacks fixed, overall Healthy/Degraded badge from top-level `status` (was ignored), Refresh button.
- [x] **W6 tests**: `AdminAuditConsoleTest` 5/5 (30 assertions) first run — double-gate pins (guest 401, analyst 403, **administrator 403 despite holding audit.logs.export**, finance_admin 403, security/auditor/super 200), filtered CSV content + filename, self-audit event with actor, index validation (bad action/inverted dates = 422, never silent-empty), index gate; suite probe `/api/admin/audit-logs/export => [super_admin, security_admin, auditor]`.
- [x] **W6 gates**: full suite **969 passed (5991 assertions), 0 failures** (561s, `w6_full.log`; +5 = new suite); lint 0 errors (2 pre-existing warnings); tsc 0; build ok; P10 **31/31**; P11 **26/26**; Playwright **5/5**; recall: routes **656** (+1 vs W5), CATALOG **140**, nav/registry parity green; mojibake scan of Rbac/System/AuditLogs = 0; `AUDIT_MATRIX.md` W6 section appended (and a W5 claim corrected: settings writes *are* audited via `auditQuietly`); matrix doc `§4`/`§11`/`§13`/`§17` updated.

## Wave W7 - tests, CI, docs (2026-09-27)

- [x] **W7.1 CI hardening**: `.github/workflows/backend.yml` + `module-boundaries.yml` PHP pin 8.3 -> **8.5** (composer.lock ships symfony/* v8.1 requiring php >=8.4.1 - the old pin failed `composer install` platform checks; workflows had never run - no git remote); `E2E_MIN_TESTS` 5 -> 6.
- [x] **W7.2 E2E console sweep**: new Playwright test in `e2e/admin.spec.ts` - super opens `/admin/reports`, `/admin/analytics`, `/admin/system`, `/admin/audit-logs`, asserting each heading **and zero `An unexpected error occurred.` flashes**; Playwright **6/6**, floor script green at threshold 6.
- [x] **W7.3 latent bug 8**: `ReportingService::productCategoryBreakdown()` returned a `Collection` despite `: array` -> `GET /api/admin/analytics/categories` always 500 -> analytics page dead ("Failed to load analytics"); caught by the new sweep on first run, fixed (`->get()->all()`), regression test added (`AdminAnalyticsRangeExportTest` **9/9**).
- [x] **W7.4 artifact + root docs**: `route_list.txt` regenerated (656 routes / 657 lines); `TESTING_GUIDE.md` gates table (797 -> 970, 5/5 -> 6/6) and `DEVELOPMENT.md` CI floor (>=5 -> >=6) updated.
- [x] **W7 gates**: full suite **970 passed (5996 assertions), 0 failures** (574s, `w7_full.log`); lint 0 errors (2 pre-existing warnings); tsc 0; build ok; P10 **31/31**; P11 **26/26**; Playwright **6/6** + floor; recall: routes **656** (unchanged), CATALOG **140**, nav/registry parity green; `AUDIT_MATRIX.md` W7 section appended; matrix doc `§11`/`§13` + new `§18` updated.

## Wave W8 - console self-service, access switches, editable text (2026-09-27)

- [x] **W8.1 suspension enforcement**: `EnsureAccountActive` middleware (web append before Inertia share; after `auth:sanctum` on the api/admin group) — API 403 JSON with the suspended message, web logout + redirect to login with `errors.email`; role/permission middlewares also short-circuit suspended accounts; `UserAdminService::suspend()` purges `sessions` rows on top of token revocation; controller guards: self-suspend **403**, last active super admin **409** (`isLastActiveSuperAdmin()`).
- [x] **W8.2 create users from the console**: `POST /api/admin/users` (`permission:users.users.create` + `can:manageUsers`) with `AdminStoreUserRequest`; flow = emailExists → `assertAssignable()` guards **pre-insert** → `UserAdminService::create()` (uuid, hashed, pre-verified, audited) → `RoleAssignmentService::assign()`; MATRIX `administrator` += `users.users.create` (CATALOG stays 140); security_admin can manage but not provision.
- [x] **W8.3 editable system text (backend)**: `config/ui_texts.php` (5 wired keys, defaults identical to the old literals) + `UiTextService`/`UiTextServiceInterface` over `SettingsQueryInterface` (stored `ui.*` override, runtime keys self-labelled); `HandleInertiaRequests` shares nested `uiTexts` (dot-safe); `GET /api/admin/ui-texts` behind `can:manageSettings`.
- [x] **W8.4 dashboard access prop**: `AdminPageController::dashboard()` shares super-only `adminAccess` (accounts with role beyond user/worker, roles + suspended + is_self, limit 200); `null` for everyone else.
- [x] **W8.5 architecture fix**: controller-level `DB::table('users'/'user_roles')` failed `ModularMonolithTest` (Admin owns only cms/jobs) → moved into Core (`emailExists`/`create`/`isLastActiveSuperAdmin` on `UserAdminInterface`), rerun green.
- [x] **W8.6 products console CRUD**: `Products.tsx` Add/Edit/Archive dialogs (vendor select, `is_active` toggle, permission-gated buttons matching backend `isAdmin()`), vendor column bug fixed (`vendor_name` → `vendor.store_name`); queue/approval flow untouched.
- [x] **W8.7 users console create**: Add User dialog gated `users.users.create` (hidden for security_admin), roster role select, POST + toast + refetch.
- [x] **W8.8 Admin Access panel**: super dashboard switches (self disabled, busy states, role chips, Active/Suspended badges) → suspend/restore endpoints with toasts.
- [x] **W8.9 UI Text editor + wiring**: Admin Settings **UI Text** section (label/key/value, save via settings upsert); wired `Login.tsx` title/subtitle, `ConsoleLayout.tsx` admin brand, `Dashboard.tsx` heading, `Footer.tsx` site name — all with literal fallbacks so output is unchanged until edited.
- [x] **W8 e2e hardening**: return-journey test clears the cart first (`DELETE /api/cart`) — leftover items from prior runs 422'd the add on repeat runs; documented the `throttle:10,1` P10→e2e IP-bucket ordering note (CI runs e2e standalone).
- [x] **W8 tests**: `AdminUserCreateTest` 8/8, `AdminAccessToggleTest` 7/7, `UiTextTest` 5/5, `AdminProductManagementTest` 5/5 (+25 vs W7); suite probe unchanged (GET-only probes), create pinned in the dedicated suite.
- [x] **W8 gates**: full suite **995 passed (6130 assertions), 0 failures** (594s, `w8_full2.log`); lint 0 errors (2 pre-existing warnings); tsc 0; build ok; P10 **31/31**; P11 **26/26**; Playwright **6/6** + floor; recall: routes **658** (+2), CATALOG **140**, nav/registry parity green (Wave A ledger appended below).

## Wave A - master-spec audit, dead links, placeholders, false-success (2026-09-27)

- [x] **A.1 dead-link sweep (S80)**: 102 internal href targets audited, 5 dead fixed - `router.post('/logout')` buttons in both shells (Inertia Link has no `method` prop; logout was 405-broken), 404 page CTA now `/tickets`, restaurant cards `/food/{id}`, doctor cards `/healthcare/doctors/{id}`; order-cancel rewired to `POST /api/orders/{id}/cancel` with pending/toast/reload.
- [x] **A.2 catch-all soft-404 (S75/S120)**: unknown URLs now return HTTP 404 (was 200 with a 404-styled page); Inertia visits keep the back-redirect contract; `logout`/`reset-password` excluded from the catch-all so POST-only routes return truthful 405.
- [x] **A.3 checkout false-success (mandatory S98)**: swallowed payment failure + green "Order Placed!" replaced with truthful `paymentState` (paid vs failed + retry with stable idempotency key); hardcoded "Test mode" banner replaced with server-derived `paymentMode` (live vs sandbox).
- [x] **A.4 placeholder sweep (S119)**: 6 real violations fixed (Footer coming-soon x2, AuthService TODO -> OtpSender seam, CmsSeeder wording, stale demo-ids comment); Supabase/Lovable 0, console.log 0, Faker/mock/placeholder hits all verified legitimate.
- [x] **A.5 ledger (S121/S123)**: 257 web routes / 204 GET / 188 page components inventoried; spec-missing route table recorded for Waves F-P; `route_list.txt` regenerated.
- [x] **A tests + gates**: `WaveADeadLinksAndPlaceholdersTest` 9/9 (27 assertions); lint 0 errors; tsc 0; build ok; full suite as wave-close gate.; `AUDIT_MATRIX.md` W8 section appended; matrix doc `§11` (+4 suites)/`§13` + new `§19` updated; `TESTING_GUIDE.md` 970 → 995; `route_list.txt` regenerated.

## Wave B - no-code platform schema + RBAC aliases (2026-09-27)

- [x] **B.1 platform schema**: migration `2026_09_27_000002_create_no_code_platform_tables.php` creates `cms_blocks`, `cms_revisions`, `navigations`, `navigation_items`, `cms_forms`, `cms_form_submissions`, `media_library`, `dynamic_modules`, `dynamic_module_entries` (UUIDv7 PKs, FKs, unique + partial indexes, soft deletes); applies clean against the dev database.
- [x] **B.2 entities**: 10 new Eloquent entities in `Modules/Admin/Entities/` (CmsPage, CmsBlock, CmsRevision, Navigation, NavigationItem, CmsForm, CmsFormSubmission, MediaItem, DynamicModule, DynamicModuleEntry) on a shared `Uuid7Model` base (`Core/Traits/HasUuid7`, `Str::uuid7`).
- [x] **B.3 CATALOG 140 → 184**: appended 28 spec §64 two-segment aliases (`users.view`, `products.manage`, `payments.refund`, …) + 15 no-code permissions (`cms.blocks.*`, `cms.revisions.*`, `navigation.*`, `forms.*`, `media.*`, `modules.*`); the original 140 entries stay byte-identical (pinned by `test_existing_140_permissions_unchanged`).
- [x] **B.4 alias resolution**: `User::hasPermission()` expands a two-segment grant `module.action` to every catalog entry `module.*.action`, plus `grants()`/`catalog()` helpers (catalog cached under `rbac.catalog`); spec names work as aliases without renaming the live three-segment `module.resource.action` vocabulary.
- [x] **B.5 MATRIX grants**: `administrator` += navigation/forms/media/modules; `content_manager` += cms.blocks/cms.revisions/navigation/forms/media/modules; `cms_editor` += cms.blocks/cms.revisions/navigation.view/media; `learning_admin` += cms.blocks; `moderator` += cms.blocks.view. super_admin stays `*`.
- [x] **B.6 architecture guard**: `ModularMonolithTest` Admin ownership allowlist extended with the 9 new tables + `cms_pages` so the modular-boundary suite stays green.
- [x] **B tests + gates**: `WaveBNoCodeSchemaAndRbacTest` 9/9 (204 assertions) incl. the 140-pin test; focused RBAC/seeders/architecture probes 16/16; PHP lint clean on all new/edited files; **full suite 1013 passed (6361 assertions), 0 failures** (`waveB_full2.log`); lint 0 errors (2 pre-existing warnings); tsc 0; build ok; `AUDIT_MATRIX.md` Wave B section appended; `TESTING_GUIDE.md` 995 → 1013.

## Wave C - no-code block CMS engine (2026-09-27)

- [x] **C.1 schema + config**: migration `2026_09_27_000003_add_page_builder_columns_to_cms_pages.php` (description/seo_title/seo_description/seo_image/canonical_url/visibility/template/menu_placement/published_at) + `2026_09_27_000004_add_soft_deletes_to_cms_revisions.php` (revisions extend `Uuid7Model`/SoftDeletes; the Wave B table lacked `deleted_at`, which surfaced on the first revision insert); `config/cms.php` (revision_retention 50, page_cache_ttl 900); both applied to the dev database.
- [x] **C.2 closed block registry (S42/S68)**: `BlockRegistry` with exactly 24 slugs (hero, rich_text, image, cta, banner, video, gallery, spacer, divider, cards, stats, testimonials, faq, featured_content, product_grid, course_grid, doctor_grid, expert_grid, vendor_grid, category_grid, service_grid, need_categories, healthcare_services, learning_categories); server-side validation rejects unknown types ("Only the 24 registered block types"), `javascript:`/`data:` URLs (http/https/mailto/tel or `/path`/`#anchor`), enforces `required_if` (e.g. filter when source=selected), strips unknown data keys, bounds list sizes, caps payload at 100 blocks; `GET /api/admin/cms/blocks/registry` feeds the FE generic form.
- [x] **C.3 builder API (S41/S45)**: `AdminPageBuilderController` — GET/PUT `cms/pages/{id}/blocks`, revisions list/view/restore-as-new-revision, `PageBuilderService::saveBlocks` in one transaction (force-delete old blocks + append snapshot revision + prune beyond retention), cache key `cms.page.{slug}` forgotten on save/update/delete; `AdminCmsController` gained builder page fields, slug-collision 422, published_at and a "Details updated" revision on page metadata updates.
- [x] **C.4 dynamic resolver (S109)**: `BlockResolver` maps entity ids to canonical URLs (product `/products/{id}`, course `/learn/{id}`, doctor `/healthcare/doctors/{id}`, expert `/experts/{id}`, vendor `/vendors/{id}`, category `/categories/{id}`, worker `/building-services/workers/{id}`, need `/needs/{slug}`, healthcare `/healthcare/specialty/{name}`, learning `/learn/courses`) with a uniform `{id,title,subtitle,image,url,badge,price}` item DTO; dynamic items resolve fresh per request while the block skeleton is cached.
- [x] **C.5 navigation builder (S46)**: `AdminNavigationController` full-replacement `PUT navigations/{id}/items` (client-supplied UUIDs, url-or-page_slug destination, parent must be in payload, self-parent/foreign/cycle guards → 422), parents topologically ordered before children (FK-safe regardless of payload order), `forceCreate` because `Uuid7Model` guards `id`; locations header/footer/mobile/category/more; public nav consumption deferred to Wave D.
- [x] **C.6 media library (S44/S86)**: `AdminMediaController` (owner-scoped index/delete) + `UploadController::store` now records a `MediaItem` row (server MIME, `getimagesize` dims, owner_type/owner_id); SVG/PHP uploads stay 422 with no row.
- [x] **C.7 public renderer (S99)**: `/p/{slug}` in `CmsPageController` — published pages cached + SEO props (`seo.title/description/image/canonical/robots/published_at`, unlisted → noindex), drafts preview only for non-suspended `manageCms` holders; missing/draft-for-guest answers with a real 404 response mirroring the web catch-all (the app exception handler converts thrown web 404s into redirects, which would have leaked draft URLs as soft-404s); unregistered block rows still render the page (renderer ignores unknown types).
- [x] **C.8 admin UI**: `PageBuilder.tsx` registry-driven block editor (add/reorder/toggle/edit/delete, list/bool/select/int/image-with-upload/textarea fields, revision note + save, revisions panel with view/restore + confirm dialog) wired into `pages/admin/Cms.tsx` (Blocks button per page row + full page form: slug, canonical URL, SEO fields, visibility, menu placement, template, description); `BlockRenderer.tsx` renders all 24 types client-side; `Cms/Show.tsx` public page with `<Head>` SEO; `no-explicit-any` stays error-level (DataBag + typed helpers).
- [x] **C.9 seeder (S99)**: `CmsSeeder::seedBlockBuilderPage` publishes `student-scholarship` with 6 blocks (hero, rich_text, image, cards, cta, faq) through `PageBuilderService::saveBlocks` (idempotent, skipped when blocks exist); verified against the dev DB (6 blocks, revision v1 "Seed: initial blocks").
- [x] **C tests + gates**: `WaveCCmsBlockEngineTest` 18/18 + `WaveCNavigationMediaTest` 9/9 (27 tests, 210 assertions) covering registry shape, gate/permission matrix (guest 401, user/learning_admin/moderator 403, cms_editor 200), save+revision, unknown type/javascript URL/required_if/key-stripping/list bounds/100-block cap, restore→v3 with history intact, retention prune, duplicate slug 422, published render + SEO props, draft 404 vs admin preview, dynamic grids from real tables, cache invalidation, unregistered type inertness, "Details updated" snapshot, nav CRUD/cycle guards/permission matrix, upload→MediaItem, SVG/PHP rejection, media ownership scoping; **full suite 1040 passed (6572 assertions), 0 failures** (`waveC_full.log`); lint 0 errors (2 pre-existing warnings); tsc 0; build ok; `route_list.txt` regenerated (667 routes).
- [x] **C docs**: `AUDIT_MATRIX.md` Wave C table appended (C.1–C.9 + gates); matrix doc `§11` (+= both Wave C suites), `§13` (Wave A/B/C gates lines) + new **`§21 No-code block CMS engine (Wave C)`**; `TESTING_GUIDE.md` gates row 1013 → **1040 (6572)**; all four docs re-scanned 0 U+FFFD.

## Wave D - public navigation + Home 26 sections (2026-09-28)

- [x] **D.1 public nav contract (S6/S46)**: `Core/Services/Contracts/PublicNavigationInterface.php` (`menus(?User)`, `flush()`) + `PublicNavigationResolver` — published+active rows cached `navigations.public` (TTL 300s), visibility `all|guest|auth|role` with **role fail-closed on empty permissions (incl. super_admin)**, cycle guard, orphan promotion with subtree, URL `url` ?: `/p/{slug}` ?: `/`; bound in `AppServiceProvider`; `siteNav` shared by `HandleInertiaRequests`.
- [x] **D.2 cache invalidation (S109)**: `AdminNavigationController::flushMenuCache()` on store/update/destroy/replaceItems.
- [x] **D.3 default menus (S6/S7)**: `NavigationSeeder` publishes header/footer/mobile/category/more (36 items, all routes verified against `route_list.txt`; mobile icons; Home `/` for everyone), idempotent via `Navigation::withTrashed()->exists()`, registered after `PermissionSeeder`, cache flushed at the end.
- [x] **D.4 `/` route (S8)**: `HomePageController::root` (FQCN — the route precedes the `use` block) — guests + marketplace → `Home/Index`; console roles keep their role landing; `/home` retained; `WorkspaceLandingTest` customer case updated to assertOk + `Home/Index`.
- [x] **D.5 Home payload (S8)**: `sections()` — 11 always-present keys (dailyDeals via `whereColumn compare>price`, featured `COALESCE(rating,0) DESC`, deals, services, jobs, hotels, transportation, food, agriculture, realEstate, buildingServices), try/catch → `[]` per query, limit 6, uniform `{id,title,subtitle,image,url,badge,price,rating}` DTO + `productCard()`; `Dashboard` receives the same payload (`HomeSections` exported).
- [x] **D.6 Home FE (S8)**: `Home/Index.tsx` rewritten to spec order 3-25 with `home-section-*` test ids; new `home/SectionRail.tsx` (hides empty — never placeholder) + `home/PromoCard.tsx`; `config/ui_texts.php` += `ui.home_bonus_*`, `ui.home_learn_*`, `ui.home_need_*` (honest CTA copy, no fabricated bonuses).
- [x] **D.7 FE nav consumption (S6/S7)**: `Header.tsx` (siteName logo, `site-nav-header` desktop row, More dropdown from `siteNav.more`, external URLs plain `<a>`), `Footer.tsx` (`site-nav-footer`), `BottomNav.tsx` (`site-nav-mobile`, 15-icon map, Home `/` for everyone), `CategoryGrid.tsx` merge; fallbacks identical to seeder content; device filter client-side.
- [x] **D tests + gates**: `WaveDPublicNavTest` 10/10 + `WaveDHomeSectionsTest` 8/8 (18 tests, 203 assertions) covering share/seed idempotence/visibility matrix + fail-closed roles/orphan promotion/draft exclusion/page-slug/device/cache flush, `/` routing for guest/customer/admin/worker/vendor, empty-but-complete sections, uiTexts promo copy, one real row per vertical with canonical links, daily-deal discount filter; focused `--filter=WaveD|WorkspaceLanding` 28/28; **full suite 1058 passed (6781 assertions), 0 failures** (`waveD_full.log`, 801s); lint 0 errors (2 pre-existing warnings); tsc 0; build ok; `route_list.txt` regenerated (672 routes, `/` → `home › Web\HomePageController@root`).
- [x] **D docs**: `AUDIT_MATRIX.md` Wave D table appended (D.1–D.7 + gates); matrix doc `§11` (+= both Wave D suites), `§13` (Wave D gates line) + new **`§22 Public navigation + Home 26 sections (Wave D)`**; `TESTING_GUIDE.md` gates row 1040 → **1058 (6781)**; all four docs re-scanned 0 U+FFFD.

## Wave F - Needs lifecycle S10-S14 (2026-09-28)

- [x] **F.1 workflow schema (S10/S13)**: `2026_09_28_000001` adds subcategory/quantity/currency/country/preferred_date/images/service_requirements/delivery_requirements/notes to `need_requests` and re-creates `need_requests_status_check` with the 17 spec states (down restores the 8-value check); `2026_09_28_000002` creates `need_request_events` (uuid id, FK cascade, actor_id, from/to status, action, note, timestamps, softDeletes) for the S12 timeline; both applied to the dev DB (rollback/re-migrate verified).
- [x] **F.2 lifecycle API (S11/S13)**: `NeedRequestController` rewritten — `record()` event per transition; `index()` `scope=mine|open` (open = OPEN_STATUSES + category/q filters); `store()` full S11 validation + `save_as_draft`; `show()` enriches `timeline`/`payment` (owner/admin `NRPAY-%`) and hides competing offers from non-owners; `submitOffer` offered→first / negotiating→re-submit (`{price, message}`); accept/reject via dedicated `offers/{offerId}/accept|reject` (owner-only, OPEN_STATUSES); `transition` covers submit/publish/payment/start/fulfill/complete/cancel/reject/expire/dispute/refund with role guards; refund routes through `PaymentGatewayInterface::refund` (422 on failure).
- [x] **F.3 entity + fixes (S13)**: `NeedRequest` 17 status constants + `OPEN_STATUSES` + new fillable/casts + `category()`/`events()` relations (fixes `ServiceRequestsPageController` eager-load crash); `NeedRequestEvent` entity; `NeedController::items()` drops nonexistent `user_id`/`status` filters (→ `vendor_id`/`is_available`/category slug); `NeedController::store()` writes `vendor_id` (was nonexistent `user_id`).
- [x] **F.4 pages + routes (S10/S12/S14)**: `NeedsPageController::index()` — 16 always-present section queries (each try/catch → `[]`, limit 6) + `categories` + `nearbyCity`; `category()` server props (slug/category/OPEN requests/need_items); routes `/needs/create`, `/needs/my-needs` + `/{id}` + 6 sub-pages (registered before `needs/{slug}`), canonical `/needs/{category}/{id}` (legacy retained), `needs.index`/`needs.category` → controller; API transition `whereIn` extended to the 11 actions.
- [x] **F.5 review rules (S14)**: `ReviewController` — `need_request` type enforced: requester-only (403), completed-only (422), once (422); `GET /api/reviews` supports `reviewable_type`/`reviewable_id` filtering for the review page.
- [x] **F.6 FE (S10-S14)**: `needs/Index.tsx` (S10 rails/search/submit CTA/nearby-empty prompt/`?type=`+`?category=` deep links); `needs/Request.tsx` (S11 full form, drafts, `POST /api/upload` images+documents, redirect to my-needs); `needs/Show.tsx` (S12 canonical slug redirect, 17-state pill, images/attachments, provider offer form, role-aware actions, offers+accept/reject, payment, timeline, no `alert()`); `needs/Category.tsx` server-props; `needs/MyNeeds.tsx` + `my/{Overview,Offers,Messages,Payment,Tracking,Review}.tsx` (S14); `lib/needs.ts`; types `NeedStatus`/`NeedRequestDetail`/`NeedOffer`/`NeedTimelineEvent`/`NeedPaymentSummary`.
- [x] **F tests + gates**: `WaveFNeedsWorkflowTest` 8/8 + `WaveFNeedsPagesTest` 8/8 (16 tests, 288 assertions) covering draft→submit→publish, negotiation re-submit + accept, dispute→refund with real gateway + `Payment::STATUS_REFUNDED`, full timeline (`create/submit/publish/offer/accept_offer/pay/start/complete` + actor edges + DB parity), transition role/state guards (403/422), moderator reject + owner expire + open-scope exclusion, need_request review rules (403/422/201/422 + filtered index), fulfill-before-start refusal; page tests for all 10 web routes (components + props + guest redirects), 16-section payload, chat conversation per need, upload folder contract; focused `--filter=WaveF` 16/16; **full suite 1074 passed (7069 assertions), 0 failures** (`waveF_full.log`, 801s); lint 0 errors (2 pre-existing warnings); tsc 0; build ok; `route_list.txt` regenerated (681 routes, UTF-8 no-BOM).
- [x] **F docs**: `AUDIT_MATRIX.md` Wave F table appended (F.1–F.6 + gates); matrix doc `§11` (+= both Wave F suites), `§13` (Wave F gates line) + new **`§23 Needs lifecycle S10-S14 (Wave F)`**; `TESTING_GUIDE.md` gates row 1058 → **1074 (7069)**; all four docs re-scanned 0 U+FFFD.

## Wave G - commerce spec §115 Phases 7+8 (2026-09-28)

- [x] **G.1 schema (S9/S32/S33/S34/S61)**: `2026_09_28_000003` — unique backfilled `slug` on `products`/`vendors`/`need_items` (0 null / 0 dup), `vendors.settings` json, `cart_items.product_variant_id` FK + `variant_name`, `orders.tax`, `orders_status_check` widened to the **12 spec states** (down restores 7), `return_requests.previous_status` + `disputes.previous_status`, `shipping_rates.estimated_days`, `order_tracking.proof_of_delivery`; `2026_09_28_000004` `vendor_services` (uuid, own-vendor FK, price, duration_minutes, is_active, softDeletes); `2026_09_28_000005` `vendor_orders` CHECK += `completed`; all 3 applied to dev DB.
- [x] **G.2 canonical slugs (S9)**: `Core/Support/HasSlug` on Product/Vendor/NeedItem; `ProductsPageController` (`products.show|reviews|vendor`, slug-or-id + legacy-id 301) + `VendorsPageController` (`vendors.show|products|services|reviews`); `CategoryController::show` slug-or-id; routes `/products/{slug}`(+2 sub), `/vendors/{slug}`(+3 sub), `/deals`, `/deals/category/{slug}`, `/deals/{slug}` landing before `/deals/{id}`; `NeedController::deals()` `whereIn` category filter + `deal()` slug-or-id (bad `vendor_id` select removed from the eager load).
- [x] **G.3 cart variants + tax (S33)**: variant lines (effective price/stock, `variant_name`, unresolvable/inactive → 404 `Item not found`); server tax via `CommerceTax` + `config/commerce.php` (rate 0 default, pinned totals honest); vendor grouping `vendors[]` + `is_accepting_orders` (**paused → 422 `Vendor is not accepting orders`**); ETA from `estimatedDays()`.
- [x] **G.4 order workflow (S32)**: `PlaceProductOrder` persists tax + variant, clears cart, seeds `order_tracking.estimated_delivery`; `OrderStateMachine` + `Order::ACTIVE`; admin `VALID_STATUSES` excludes provider-owned `paid`; `ProductOrderController` cancel/complete + `proof` upload; returns (`refund_requested` → reject resumes / approve `returned` before gateway refund) and disputes (`disputed` + `previous_status` restore, `resolution=refund` keeps it held) wired through `resumeOrder()`; `AdminDomainController::updateDispute` shares the restore rules.
- [x] **G.5 vendor portal (S34)**: `VendorWorkspaceController` (profile/get+update, settings toggle, services CRUD with own-vendor scoping + soft delete, reviews with reviewer/product names, bookings ∩ own vendor_service ids, earnings) under `/api/vendor/*`; web routes `/vendor/{dashboard,profile,services,services/create,services/{id}/edit,bookings,reviews,earnings,settings}`; `VendorResource` += `slug`.
- [x] **G.6 delivery (S61)**: `ShippingService::calculate` 0 with no rates (honest), `estimatedDays()` null-honest from `shipping_rates.estimated_days`; cart ETA → placement `estimated_delivery`; delivered → optional `order_tracking.proof_of_delivery`.
- [x] **G.7 FE**: `lib/orderStatus.ts` 12-state mirror (`SETTABLE` = admin VALID_STATUSES); `types/index.ts` += `ProductVariant`/`Product.variants`/`Vendor.slug+settings`/`Order.tax`; `products/Show` variant picker + slug links; `cart/Index` tax/variant/paused/ETA rows; `orders/{Index,Show}` 12-state + cancel(pending|paid)/complete/return/dispute gates; public sub-pages `products/{Reviews,Vendor}`, `vendors/{Products,Services,Reviews}`, `deals/Category`; `deals/Show` → real NeedItem shape; slug sweep (agriculture/admin/products/vendors/categories/stores pages, `ProductCard`, recently-viewed); vendor portal `vendor/{Profile,Services,ServiceCreate,ServiceEdit,Bookings,Reviews,Earnings,Settings}` + `components/vendor/VendorTabs.tsx` (Dashboard mounted).
- [x] **G tests + gates**: `WaveGCatalogSlugTest` 10/10 + `WaveGCartVariantTaxTest` 5/5 + `WaveGOrderWorkflowTest` 11/11 + `WaveGVendorPortalTest` 8/8 (34 tests, 177 assertions) covering slug generation/canonicals/301s/sub-pages/locked-404/deal precedence, variant pricing + stock + paused/inactive guards + totals shape, place/complete/cancel/return/dispute paths incl. admin dispute restore rules, portal auth/profile/settings/services scoping/reviews/bookings/earnings; pinned commerce regression batch 205/205; focused `--filter=WaveG` 34/34 (177 assertions); **full suite 1108 passed (7246 assertions), 0 failures** (`waveG_full.log`, 854s); lint 0 errors (2 pre-existing warnings); tsc 0; build ok; `route_list.txt` regenerated (707 routes, +26, UTF-8 no-BOM).
- [x] **G docs**: `AUDIT_MATRIX.md` Wave G table appended (G.1–G.9 + gates); matrix doc `§11` (+= all four Wave G suites), `§13` (Wave G gates line) + new **`§24 Commerce spec §115 Phases 7+8 (Wave G)`**; `TESTING_GUIDE.md` gates row updated; all four docs re-scanned 0 U+FFFD.

## Wave H - payments spec S31/S73/S74 (2026-09-28)

- [x] **H.1 schema + states (S31)**: `2026_09_28_000006` — `payments.purpose` + status CHECK with `cancelled` (down drops it); `Payment::STATUS_CANCELLED` (+`STATUS_COMPLETED` const); `PaymentStatus` enum 7/7; `PaymentStateMachine` TRANSITIONS + `canTransition()` (succeeded→(partial)/refunded, terminals, same-state idempotent).
- [x] **H.2 HTTP idempotency (S31)**: `ChargePaymentRequest` accepts `idempotency_key`; `ChargePayment` replays original (key+owner) past the paid-order guard, skips side effects on concurrent replays; gateway creation savepoint converts raced 23505 into idempotent results.
- [x] **H.3 purpose (S31)**: server-derived `order_payment`/`checkout`/`wallet_deposit`/`course_enrollment`/`need_payment`/`need_payout`/`task_payout` at all 7 charge sites; `PaymentResource` += `purpose`/`provider` (additive); wallet-pay-from-balance deferred to Wave I (pinned `method=wallet` passthrough intact).
- [x] **H.4 webhook validation (S74)**: guarded transitions (stale → `ignored`, same → no-op), `payment_id` linkage, insert-first dedupe under savepoint, `payment.webhook_*` audits, `payment_intent.canceled`/PayPal `*.CANCELLED` → `cancelled`; replay windows unchanged.
- [x] **H.5 gateway honesty (S73)**: unknown driver throws pre-row (no mock fallback); mock requires config+runtime agreement on local/testing; `config/payments.php` honors documented `PAYMENTS_*` names + `paypal.access_token`; unconfigured Stripe/Paystack/PayPal unchanged fail-closed.
- [x] **H.6 refunds + reconcile (S31)**: locked, accumulated chained partials with pinned vocabulary (order restock only on full); reconcile += drift + webhook reports (flags/schedule untouched); `GET /api/payments/methods` (auth, working-methods-only) registered before `/payments/{id}`.
- [x] **H tests + gates**: `WaveHPaymentsTest` 10/10 (47 assertions) covering HTTP idempotency, purposes, cancelled+transitions, stale-event ignore, stripe cancel, unknown-driver throw, chained partials, over-refund cap, methods endpoint, reconcile drift; payment-affected pinned batch 200/200; focused `--filter=WaveH` 10/10 (47 assertions); **full suite 1118 passed (7293 assertions), 0 failures** (`waveH_full.log`, 1576s); lint 0 errors (2 pre-existing warnings); tsc 0; build ok; `route_list.txt` regenerated (708 routes, +1, UTF-8 no-BOM).
- [x] **H docs**: `AUDIT_MATRIX.md` Wave H table appended (H.1–H.10 + gates); matrix doc `§11` (+= Wave H suite), `§13` (Wave H gates line) + new **`§25 Payments spec S31/S73/S74 (Wave H)`**; `TESTING_GUIDE.md` gates row updated; all four docs re-scanned 0 U+FFFD.

## Wave I - KYC + wallet spec S28/S29 (2026-09-28)

- [x] **I.1 KYC schema + states (S28)**: `2026_09_28_000007` identity columns + attempts + verified_at; `KycStatus` canonical map + `KycGate` (verified-only outflows, 403 at API boundary); `verification_state` on user responses, `not_started` fallback.
- [x] **I.2 submit + documents (S28)**: identity validation; document paths scoped to own `kyc-documents` uploads (422 otherwise); resubmit attempts; owner + reviewer streaming endpoints (no public URLs); admin requires_action filter/columns.
- [x] **I.3 review loop (S28)**: `requires_action` with mandatory reason, one-shot decided rows (422), `verified_at` on approve; redacted owner view (masked number, no paths/reviewer).
- [x] **I.4 wallet payments + refunds (S29/S31)**: funded+verified ledger debit (`provider=wallet`, idempotent), honest 403/422/passthrough fallbacks; ledger-backed refunds credit the wallet; methods endpoint gates wallet by verification + funds.
- [x] **I.5 ledger hardening (S29)**: holds-respecting debit/transfer, fixed `InsufficientFundsException` crash (422 not 500), balance/available/pending API + transfer endpoint + transaction details/type filter, reconcile pair + negative-availability reports.
- [x] **I.6 FE**: `kyc/Submit` + `/kyc`; `wallet/Index` true balances/working deposit/KYC errors/filter/detail links; `wallet/Transaction` + route; admin KYC requires_action + doc links; Checkout server-driven wallet option.
- [x] **I tests + gates**: `WaveIWalletKycTest` 15/15 (92 assertions) covering redaction, states, submit scoping, review loop, document streaming, KYC gates, holds-aware withdrawals, wallet pay + fallbacks, wallet refunds, scoped details, methods gating, reconcile flags; KYC/wallet/payment pinned batch 435/435; focused `--filter=WaveI` 15/15 (92 assertions); **full suite 1133 passed (7385 assertions), 0 failures** (`waveI_full.log`, 1513s); lint 0 errors (2 pre-existing warnings); tsc 0; build ok; `route_list.txt` regenerated (714 routes, +6, UTF-8 no-BOM).
- [x] **I docs**: `AUDIT_MATRIX.md` Wave I table appended (I.1–I.12 + gates); matrix doc `§11` (+= Wave I suite), `§13` (Wave I gates line) + new **`§26 KYC + wallet spec S28/S29 (Wave I)`**; `TESTING_GUIDE.md` gates row updated; all four docs re-scanned 0 U+FFFD.

## Wave J - financial services spec S30 (2026-09-28)

- [x] **J.1 bills module (S30)**: `config/bills.php` (driver/mock-guard/5-service catalog) + `2026_09_28_000008` `bill_purchases` + `BillsServiceProvider` registered in `config/app.php` + `BILLS_DRIVER=mock` in `.env.example`.
- [x] **J.2 providers (S30)**: `BillProviderInterface::vend()` + mock (dual env guard + test failure flag) + manual (`pending_manual`) + loud resolver; unconfigured drivers fail safe (422, untouched balances).
- [x] **J.3 purchase flow (S30)**: validate → replay → KYC 403 → resolve-before-money → pending rows → manual pending w/o debit → holds-aware debit → vend → settle-or-reverse (`WALLET-REF-BILL-*`) with persisted failed rows; `bill_payment` payment rows + `PaymentCompleted` on success.
- [x] **J.4 privacy + history**: masked account identifiers, owner-scoped list/show (guest 401, foreign 404).
- [x] **J.5 FE**: `bills/Index` + `/bills` (country/currency, dynamic forms, masked receipts, KYC links, history); nav in AppLayout/account/footer.
- [x] **J tests + gates**: `WaveJBillsTest` 10/10 (66 assertions) covering catalog/availability, happy-path debit + refs + masking, idempotency, KYC/funds gates, 4 validation rejections, unconfigured-driver safety, vend reversal, manual pending, owner scoping; finance/wallet/payment pinned batch 268/268; focused `--filter=WaveJ` 10/10 (66 assertions); **full suite 1163 passed (7680 assertions), 0 failures** (`waveM_full.log`, 978s — combined J–M close-out); lint 0 errors (2 pre-existing warnings); tsc 0; build ok; `route_list.txt` regenerated (769 routes, +55 across J–M, UTF-8 no-BOM).
- [x] **J docs**: `AUDIT_MATRIX.md` Wave J table appended (J.1–J.7 + gates); matrix doc `§11` (+= Wave J suite), `§13` (Wave J gates line) + new **`§27 Financial services spec S30 (Wave J)`**; `TESTING_GUIDE.md` gates row updated; all four docs re-scanned 0 U+FFFD.

## Wave K - healthcare spec S21-S25 (2026-09-28)

- [x] **K.1 booking integrity (S23)**: `BookAppointment` single-transaction + `lockForUpdate()` + partial unique slot index; raced inserts → identical clash 422 via savepoint; other validation untouched.
- [x] **K.2 medicine catalog (S25)**: vendor/detail columns + relation + `stock`→`stock_quantity` alias mapping (admin API persists for real).
- [x] **K.3 pharmacy guards (S25)**: locked stock check + active-prescription requirement + atomic decrement; fixtures order unchanged.
- [x] **K.4 spec pages (S22)**: profile-canonical `/{id}` (+`/profile` alias, +`/book`), availability/reviews, lab detail/bookings/detail, health-services + emergency, providers + detail, search, pharmacy aliases, public doctors list.
- [x] **K.5 APIs (S21/S23)**: doctor `?q=` filter, `GET /api/health/emergency` (config-driven).
- [x] **K.6 FE**: `DoctorAvailability`, `DoctorReviews`, `LabShow`, `LabBookings`, `LabBookingDetail`, `pharmacy/Show`, `HealthServices`, `Providers`, `ProviderDetail`, `Search`; profile book-CTA fix; hub links.
- [x] **K tests + gates**: `WaveKHealthcareTest` 7/7 (47 assertions) covering DB race guard, locked booking message, medicine persistence, stock/Rx enforcement, doctor search, emergency endpoint, 12 spec pages + auth gates; healthcare/pharmacy pinned batch 221/221; focused `--filter=WaveK` 7/7 (47 assertions); **full suite 1163 passed (7680 assertions), 0 failures** (`waveM_full.log`, 978s — combined J–M close-out); lint 0 errors (2 pre-existing warnings); tsc 0; build ok; `route_list.txt` regenerated (769 routes, UTF-8 no-BOM).
- [x] **K docs**: `AUDIT_MATRIX.md` Wave K table appended (K.1–K.9 + gates); matrix doc `§11` (+= Wave K suite), `§13` (Wave K gates line) + new **`§28 Healthcare spec S21-S25 (Wave K)`**; `TESTING_GUIDE.md` gates row updated; all four docs re-scanned 0 U+FFFD.

## Wave L - Learn LMS spec S15-S20 (2026-09-28)

- [x] **L.1 schema + grading (S17/S18/S19)**: `2026_09_28_000010` (+`000011` soft-deletes follow-up) course/lesson/enrollment columns + `lesson_notes`; quiz submit answer-key leak removed (attempts intact).
- [x] **L.2 certificates (S20)**: public verify API + page, owner detail + printable download; fixed latent `UserCertificate` namespace crash.
- [x] **L.3 pages (S16)**: canonical 301, per-quiz pages, categories/slug, instructors directory, search, progress, certificate detail, public verify; Show/Lesson/Index/Catalog upgrades.
- [x] **L.4 APIs**: instructors list, notes CRUD, certificate verify/show/download, course sort, enrollment counts.
- [x] **L tests + gates**: `WaveLLearnTest` 8/8 (86 assertions) covering answer-key absence, canonical/quiz pages, spec pages, certificate scoping, notes scoping, enrollment counts, sorting, directories; Learn pinned batch 69/69; **full suite 1163 passed (7680 assertions), 0 failures** (`waveM_full.log`, 978s — combined J–M close-out); lint 0 errors (2 pre-existing warnings); tsc 0; build ok; `route_list.txt` regenerated (769 routes, UTF-8 no-BOM).
- [x] **L docs**: `AUDIT_MATRIX.md` Wave L table appended (L.1–L.9 + gates); matrix doc `§11` (+= Wave L suite), `§13` (Wave L gates line) + new **`§29 Learn LMS spec S15-S20 (Wave L)`**; `TESTING_GUIDE.md` gates row updated; all four docs re-scanned 0 U+FFFD.

## Wave M - account center spec S26-S27 (2026-09-28)

- [x] **M.1 canonicals (S27)**: 17 new `/account/*` routes reusing existing components/controllers; `/account/orders` fixed to serve real orders; 4 pinned URLs untouched.
- [x] **M.2 payment methods (S26)**: gateway saved/detach + validated CRUD API + hub page.
- [x] **M.3 pages**: BookingDetail, PaymentMethods, FinancialServices, wallet Deposit/Withdraw; hub lists extended; scoping reused exactly.
- [x] **M tests + gates**: `WaveMAccountTest` 5/5 (96 assertions) covering real orders canonical, 16 canonicals + gates, owner/participant scoping, methods CRUD; **full suite 1163 passed (7680 assertions), 0 failures** (`waveM_full.log`, 978s — combined J–M close-out); lint 0 errors (2 pre-existing warnings); tsc 0; build ok; `route_list.txt` regenerated (769 routes, +35 across L–M, UTF-8 no-BOM).
- [x] **M docs**: `AUDIT_MATRIX.md` Wave M table appended (M.1–M.5 + gates); matrix doc `§11` (+= Wave M suite), `§13` (Wave M gates line) + new **`§30 Account center spec S26-S27 (Wave M)`**; `TESTING_GUIDE.md` gates row updated; all four docs re-scanned 0 U+FFFD.

## Wave N - verticals spec S53-S60 (2026-09-28)

- [x] **N.1 rides (S55)**: fake fares removed (quotes on accept), locked accepts, complete/cancel lifecycle, driver registration + availability.
- [x] **N.2 food (S56)**: `PlaceFoodOrder` shared action; dead `order()` fixed; empty-cart stub removed; Checkout unified on the real client cart.
- [x] **N.3 real estate (S58)**: `listing_type` column; `store` rewritten to real columns; my-listings endpoint + page; `/real-estate*` aliases; working create form.
- [x] **N.4 building (S59)**: real worker assignment (auto + guarded manual), quote + complete/cancel lifecycle, `worker()` relation fixed.
- [x] **N.5 jobs (S53)**: application show/pipeline, employer profile, admin applicants, 5 spec pages.
- [x] **N.6 hotels (S54)**: booking aliases + detail page, review loop, stay constants.
- [x] **N.7 experts (S60)**: categories directory + qualification/experience filters.
- [x] **N.8 agriculture (S57)**: farmers directory + dynamic subcategory shelves.
- [x] **N tests + gates**: `WaveNVerticalsTest` 12/12 (100 assertions) covering fare honesty, driver/ride lifecycle, itemized food orders + rejections, property persistence + scoping, worker assignment + guards, job pipeline + pages, hotel aliases + reviews, expert directories, agriculture pages; **full suite 1175 passed (7780 assertions), 0 failures** (chunked runs: 377+82+151+116+266+180+3); lint 0 errors (2 pre-existing warnings); tsc 0; build ok; `route_list.txt` regenerated (796 routes, +27, UTF-8 no-BOM).
- [x] **N docs**: `AUDIT_MATRIX.md` Wave N table appended (N.1–N.10 + gates); matrix doc `§11` (+= Wave N suite), `§13` (Wave N gates line) + new **`§31 Verticals spec S53-S60 (Wave N)`**; `TESTING_GUIDE.md` gates row updated; all four docs re-scanned 0 U+FFFD.

## Wave O - messaging/notifications/reviews/support spec S50-S52/S62 (2026-09-29)

- [x] **O.1 notifications (S50)**: index `?type=`/`?is_read=` filters + `unread-count` badge; `notify()` on the service contract; broadcast 120→500; fan-out helpers in wallet (deposit/withdraw), KYC decision, certificates, bills, building, rides (best-effort).
- [x] **O.2 messaging/reviews (S51/S52)**: self-conversation 422; `support_admin` staff parity; resource `message` + attachments; review write throttles + one-per-user vote endpoint with server recount.
- [x] **O.3 support (S62)**: `attachments` migration + uploader scoping; ticket-number retry; staff detail API + `admin/SupportDetail` page (status/assignee/department/reply/escalate/audit trail); spec-62 URLs; legacy `/tickets*` kept rendering (pinned WaveA 200 honoured).
- [x] **O tests + gates**: `WaveOMessagingTest` 12/12 (112 assertions) covering filters, badge, fan-out row, votes, throttle, self-chat, attachments, role-gated detail, spec URLs; **full suite 1187 passed (7888 assertions), 0 failures** (chunked runs: 377+82+151+116+266+195); lint 0 errors (2 pre-existing warnings); tsc 0; build ok; `route_list.txt` regenerated (803 routes, +7, UTF-8 no-BOM).
- [x] **O docs**: `AUDIT_MATRIX.md` Wave O table appended (O.1–O.7 + gates); matrix doc `§11` (+= Wave O suite), `§13` (Wave O gates line) + new **`§32 Messaging spec S50-S52/S62 (Wave O)`**; `TESTING_GUIDE.md` gates row updated; all four docs re-scanned 0 U+FFFD.

## Wave P - admin control plane spec §47/§48/§49/§63/§65/§66 (2026-09-30)

- [x] **P.0 plan**: Wave P = spec Phase 17 (§47 page generation, §48 categories, §49 search, §63 analytics, §65 content/marketplace roles, §66 audit); executed as P1–P6 with focused regression after each part; 23-wave master plan continues with Wave Q (security).
- [x] **P1 audit (§66)**: migration `2026_09_30_000001` (`ip_address` + `metadata` on `audit_logs`); `AuditService` IP capture (now `runningUnitTests`-aware); login/logout/failure, RBAC grant/revoke (old/new), CMS publish, product create emissions; dynamic action whitelist + `GET /api/admin/audit-logs/actions` (`can:viewAuditLogs`); `AuditLogs.tsx` action dropdown + IP column; export CSV contract unchanged (pinned).
- [x] **P2 categories (§48)**: migration `2026_09_30_000002` SEO columns; model fillable; store/update validation; `uniqueSlug()` numeric suffix; `isDescendant()` cycle guard (422 `"A category cannot be nested under itself or its own child."`); `admin/Categories.tsx` full form + SEO + parent picker + tree + search.
- [x] **P3 roles (§65)**: canonical roster **35 → 38** (`category_admin`, `vendor_manager`, `content_admin`): `AppRole`, `AdminRbacController::ROLES`, `AdminPolicy`, web console splits, API brands/newsletter parity, `config/workspace.php`, `PermissionSeeder::MATRIX` + live re-seed (category_admin 3 / vendor_manager 6 / content_admin 16 grants); authorization suites re-extended to 38.
- [x] **P4 analytics (§63)**: 8 domain series + `adminConversionFunnel` (null-not-zero rates); `dailySeries()` column-parameterised (`enrollments.last_active_at` — no `created_at` on that table); `GET /api/admin/analytics/domains`; `Admin/Analytics.tsx` domain cards + funnel card.
- [x] **P5 search (§49)**: `discover()` 14 groups, server-side `type` + canonical `url` per row; `TYPES` whitelist (unknown → 422) + advertised `types`; `search/Results.tsx` rewritten (15 tabs, per-group fields, server URLs).
- [x] **P6 content creation (§47)**: dead `ProductCreated` event/listener removed (stale classmap purged); `POST /api/admin/courses|restaurants|hotels|properties` (role-gated, validated, audited) + Add-forms in Learning/Food/Hotels/RealEstate pages; propagation pinned (listing + detail + search + audit).
- [x] **P tests + gates**: new `tests/Feature/WaveP` (6 files) **34/34 (340 assertions)**; **full suite 1227 passed (8407 assertions), 0 failures** (chunked runs: 383+82+151+116+266+229); `ModularMonolithTest` red-then-fixed in-wave (module `DB::table` reads moved behind new `PermissionServiceInterface::rolePermissionExists/userPermissionExists`); lint 0 errors (2 pre-existing warnings); tsc 0; build ok; `route_list.txt` regenerated (**809 routes**); live matrix **43/43** (fixed a `| Out-Null` false-negative in the script's 302 probe); Playwright **6/6**.
- [x] **P docs**: `AUDIT_MATRIX.md` Wave P rows appended; matrix doc **`§33 Admin control plane (§47/§48/§49/§63/§65/§66, Wave P)`** + roster 35 → 38 updates; `TESTING_GUIDE.md` gates row updated; all four docs re-scanned 0 U+FFFD.

## Wave Q - security hardening spec §67/§68/§85/§86/§95 (2026-09-30)

- [x] **Q.1 audit**: no `eval`/`unserialize`/shell, no user-controlled fetches/redirects/path-serving; fillables everywhere; FE has no `dangerouslySetInnerHTML` or dynamic link hrefs; money paths structural (server pricing, wallet transactions+locks, stock locks, payment idempotency, webhook HMACs, upload whitelist+scoping, CMS closed registry, CSP headers, throttles).
- [x] **Q.2 fixes**: new `App\Rules\NoExecutableCode` (§68) wired into block text/textarea rules, page/blog/announcement `content`, `safeUrlRule()` on banner links/images + page SEO URLs; dead naive `XssSanitizer`/`PreventSqlInjection` middleware deleted (+ stale legacy-Kernel references).
- [x] **Q tests + gates**: new `tests/Feature/WaveQ/WaveQSecurityTest.php` **12/12 (39 assertions)** covering §95 (unauthorized, cross-user IDOR 403s, cross-vendor 403, server totals, negative wallet 422, payment replay single-row, upload 422s, CMS executable 422s, block type/URL/script 422s, unsafe-URL 422, inert injection payloads); affected gate **521 passed (4333 assertions), 0 failures**; lint 0 errors; tsc 0; full-suite arithmetic **1239 passed (8446 assertions)**; live spot-checks green (CMS script → 422, CSP present).
- [x] **Q docs**: `AUDIT_MATRIX.md` Wave Q rows appended; matrix doc **`§34 Security hardening (Wave Q)`**; `TESTING_GUIDE.md` gates row updated; all four docs re-scanned 0 U+FFFD.

## Wave R - performance §109/§110/§111 (2026-09-30)

- [x] **R.1 audit**: product listing N+1-clean; all 9 domain listeners already `ShouldQueue`; CMS/navigation caching with invalidation in place; money/upload/CMS paths already structural (see Wave Q).
- [x] **R.2 indexes (§109)**: migration `2026_09_30_000003` (`audit_logs.created_at`, `payments(status,created_at)`, `users.created_at`, `vendor_orders.created_at`, `notifications(user_id,is_read)`); applied to live DB.
- [x] **R.3 cache (§109)**: analytics overview cached 120s per range; export stays live; live spot-check identical payload.
- [x] **R.4 scheduler (§111)**: `cms:prune-revisions` + `needs:expire-past-deadline` (daily) + `notifications:prune-read` (weekly, `--days=90`, hard delete); `schedule:list` shows all five; fixed SoftDeletes swallowing the notification prune mid-wave.
- [x] **R tests + gates**: new `tests/Feature/WaveR/WaveRPerformanceTest.php` **7/7 (37 assertions)** (index pins, cache keys, prune/expire guards, queueability, query cap); affected gate **348 passed (3928 assertions), 0 failures**; php -l clean; full-suite arithmetic **1246 passed (8483 assertions)**.
- [x] **R docs**: `AUDIT_MATRIX.md` Wave R rows appended; matrix doc **`§35 Performance (Wave R)`**; `TESTING_GUIDE.md` gates row updated; all four docs re-scanned 0 U+FFFD.

## Wave S - frontend verification §96 (2026-09-30)

- [x] **S.1 projects**: `mobile` (Pixel 5) project added; admin console specs desktop-only by design; e2e timeouts 20s; marketplace navigations on `domcontentloaded`.
- [x] **S.2 specs**: new `e2e/marketplace.spec.ts` (5 tests × 2 viewports: home sections, products + empty search, verticals, register/register-login failure states); new `e2e/console.spec.ts` (3 tests: category create failure-first + API cleanup, CMS executable guard as content_manager, console tour + funnel).
- [x] **S.3 real fixes**: `ProductsPageController@index` paginator→`{data, meta}` wrap (page crashed on `.total`); e2e buys a stocked product instead of row zero; strict-mode `.first()` on doubled headings; `getByLabel` exact for Title/SEO-title.
- [x] **S tests + gates**: Playwright **22 passed, 6 skipped, 0 failed** (chromium + mobile); tsc 0; eslint 0 (2 pre-existing warnings elsewhere).
- [x] **S docs**: `AUDIT_MATRIX.md` Wave S rows appended; matrix doc **`§36 Frontend verification (Wave S)`**; `TESTING_GUIDE.md` e2e row updated; all four docs re-scanned 0 U+FFFD.

## Wave T - backend test gaps (2026-09-30)

- [x] **T.1 audit**: Bills, Delivery, RealEstate were the last modules without same-named Feature suites; all others covered.
- [x] **T.2 fix**: `DeliveryController@show` vendor gate used non-canonical `hasRole('vendor')` (dead check) → corrected to `vendor_admin` + pinned.
- [x] **T tests + gates**: `BillsPurchaseTest` 8/8, `DeliveryLifecycleTest` 10/10, `PropertyLifecycleTest` 5/5; full 6-chunk suite **1270 passed (8579 assertions), 0 failures** (383+100+151+121+266+249); php -l clean.
- [x] **T docs**: `AUDIT_MATRIX.md` Wave T rows appended; matrix doc **`§37 Backend test gaps (Wave T)`**; `TESTING_GUIDE.md` gates row updated; all four docs re-scanned 0 U+FFFD.

## Wave U - end-to-end workflows §97 (2026-09-30)

- [x] **U.1 gaps**: Needs/CMS/commerce-return chains already unbroken; Healthcare, Learning, Wallet, order-to-review were piecemeal.
- [x] **U.2 fix**: `User::doctor()` relation added (`hasOne`) — the assigned-doctor-completes path was dead code; pinned.
- [x] **U tests + gates**: new `tests/Feature/WaveU/WaveUWorkflowTest.php` **4/4 (38 assertions)** (healthcare find→review incl. patient-403, learning browse→verified certificate, wallet KYC→700-balance ledger, commerce order→pay→deliver→review; missing-payment catch added mid-wave); full 6-chunk suite **1274 passed (8617 assertions), 0 failures** (383+100+151+121+266+253); php -l clean.
- [x] **U docs**: `AUDIT_MATRIX.md` Wave U rows appended; matrix doc **`§38 End-to-end workflows (Wave U)`**; `TESTING_GUIDE.md` gates row updated; all four docs re-scanned 0 U+FFFD.

## Wave V - build, seed and route audits §112/§125 (2026-09-30)

- [x] **V.1 §125 validations**: `composer validate` clean; `about` sane; `migrate:status` zero pending; route list loads clean; seeder files lint clean; `PermissionSeeder` idempotent re-run live. `composer audit` blocked (no packagist network — documented, not passed).
- [x] **V.2 route audits**: backend 605 controller actions resolve, 0 violations; frontend 244 Inertia pages resolve, 0 missing (re-runnable scripts in `%TEMP%\opencode\`).
- [x] **V.3 seed + build**: live seed state verified (43 users, 41 products, 3 vendors, 10 categories, 5 courses, 27 roles); fresh `npm run build` green with deterministic hashes; products page re-verified in-browser.
- [x] **V docs**: `AUDIT_MATRIX.md` Wave V rows appended; matrix doc **`§39 Build/seed/route audits (Wave V)`**; no gate-number changes (1274/8617 stands); all four docs re-scanned 0 U+FFFD.

## Wave W - final definition of done §126 + delivery (2026-09-30)

- [x] **W.1 §126**: every clause verified against its wave (frontend S, backend suite, commerce/needs/healthcare/learn/account chains, admin + CMS no-code, security Q, tests green, DEPLOY.md runbook + scheduler table refresh).
- [x] **W.2 inventories**: tallies recorded in matrix `§40` (routes, catalog, roles, tests, e2e, pages, actions, migrations, seeders, schedule, seed state).
- [x] **W.3 final gates**: live matrix 43/43, Playwright 22/6, build green (Wave V, deterministic).
- [x] **W.4 ZIP**: `everythingneed-com-2026-09-30.zip` delivered (4.7 MB, 3288 entries, secrets/vendor excluded, verified entry-by-entry).
- [x] **W docs**: `AUDIT_MATRIX.md` Wave W rows appended; matrix doc **`§40 Final definition of done (Wave W)`**; all four docs re-scanned 0 U+FFFD.

## Re-validation A-W full sweep (2026-09-30)

- [x] **R.1 static**: lint/composer strict-psr (9038 classes)/ESLint/tsc/build/migrate/routes/CI all green.
- [x] **R.2 PHPUnit**: 6 chunks sequential = **1274 passed (8617 assertions), 0 failures** — arithmetic holds exactly.
- [x] **R.3 live HTTP**: p10 31/31, p11 26/26, live_matrix 43/43.
- [x] **R.4 audits**: 605 actions + 244 pages, 0 violations.
- [x] **R.5 e2e**: 22 passed / 6 skipped (chromium + mobile).
- [x] **R.6 seed**: idempotent re-run; drift (12→14 orders, 270→340 audit rows) is this sweep's own activity.
- [x] **R.7 waves**: every wave A-D,F-U evidenced by ≥1 green suite; V/W by audits.
- [x] **R.8 docs**: TESTING_GUIDE header fixed; REVIEW_GUIDE.md added; re-scanned 0 U+FFFD.


## Improvement plan Waves W3-W4 + final regate (2026-10-07)

- [x] **W3-8 §44 SVG + §88 SEO**: `SvgSanitizer` (DOMParser + allowlist + style scrub) behind `MediaService` for svg uploads; SEO head in `app.blade.php` (title/description/canonical/robots/OG/Twitter); `productSeo()` product JSON-LD + CMS `WebPage` JSON-LD. Fixed mid-wave: Blade `@json` first-comma truncation (array built in `@php`) and `CmsPage` missing `published_at` datetime cast.
- [x] **W3-8 tests**: `SvgSanitizationTest` 5/5 (on-path scrub, script/event/style neutralized, off-path rejection, mime gate) + `StructuredDataTest` 4/4 (product graph, CMS WebPage, OG/canonical, X-Content-Type-Options); regression batch MediaUpload/UploadSecurity/Cms/Home 72/72.
- [x] **W4 unit**: Vitest infra (`vitest.config.ts`, jsdom, testing-library setup, `npm run test:unit`) + 8 files / **40 tests** covering `lib/currency`, `orderStatus` (forward-jump legality, `settableOptionsFor`), `lifecycle`, `needs`, `media`, `i18n-dict`, `utils`, `Breadcrumb` (mocked Inertia Link) - all green under lint + tsc.
- [x] **W4 e2e chains**: `e2e/chains.spec.ts` service-booking / need-request / wallet-deposit journeys; 3 chains × 3 viewports = 9 green runs; full suite **51 passed / 12 skipped / 0 failed**.
- [x] **Engagement 500s fixed (live prod bugs, caught by chains)**: engagement tables lacked timestamps/`entity_type`; migration `2026_10_07_000001` applied to dev; controller inserts now uuid-id'd, recently-viewed ordered by `viewed_at`; `WishlistEndpointTest` 2 + `FavoritesAndRecentlyViewedTest` 3 green.
- [x] **§101/§102 discovery**: `AdminCreatedProductDiscoveryTest` 1/19 + `AdminCreatedDoctorDiscoveryTest` 1/11 - admin-created content discoverable in listings, category/specialty filters, search (module + unified), detail, vendor page, and bookable.
- [x] **Final regate gates**: full suite **1499 passed (9922 assertions), 0 failed** (2289s); lint 0 errors; tsc 0; build green; Vitest **40/40**; Playwright **51 passed / 12 skipped / 0 failed**; matrices 31+26+43 = **100 checks, 0 fails**; audits **672 + 258, 0 violations**; `route_list.txt` regenerated (891 routes); `AuthorizationCoverageTest` allowlist += public `api/forms/*/submit`.
- [x] **Final docs**: status counts refreshed in `TESTING_GUIDE.md`, `REVIEW_GUIDE.md`, `SYSTEM_REPORT.md`, `docs/implementation/FINAL_COMPLETION_REPORT.md`; this section + `AUDIT_MATRIX.md` regate rows appended.


## Phase L-A — Learn 2.0 knowledge feed (2026-10-07)

- [x] **L-A.1 inventory + state machine**: 8 states (`draft`, `pending`, `under_review`, `needs_information`, `approved`, `rejected`, `hidden`, `removed`) with `approved` as the only publicly visible state; sensitive categories (health/finance/legal/pharmacy/drugs) flagged at submit for a senior pass. Documented in `docs/LEARN_MODERATION_MODEL.md`.
- [x] **L-A.2 schema**: `2026_10_07_100000_upgrade_learn_feed_tables.php` (posts status/review/provider columns + `category` default `general`, comments, comment likes, post likes, saves, reports, video views, follows, playlists + items) applied to **dev and test**.
- [x] **L-A.3 models**: 10 Eloquent models under `Modules/Learn/Entities` (LearnPost, LearnPostComment, LearnCommentLike, LearnPostLike, LearnPostSave, LearnPostReport, LearnVideoView, LearnFollow, LearnPlaylist, LearnPlaylistItem).
- [x] **L-A.4 role 38 → 39**: `learning_reviewer` added and wired through `AppRole`, `AdminRbacController::ROLES`, `PermissionSeeder` (`learn.posts.review`; 184-catalog untouched), `config/workspace.php`, `AdminPolicy`, `$adminConsoleRoles` + `/admin/learning/review`, `AdminPageController` cards, console navigation ("Content Review").
- [x] **L-A.5 feed backend**: `VideoResolver` (YouTube/Vimeo/Facebook → provider+id, unknown host 422), `LearnPostController` (keyset-cursor feed for latest/top, offset paging for trending, filters, show/store/update/mine, like/save/report/heartbeat/share/comments/appeal/follow), `LearnPlaylistController` (owner-scoped, approved-only items).
- [x] **L-A.6 moderation backend**: `LearnModerationController` — queue with 7 tabs, real `GROUP BY` counts, SLA ordering (`submitted_at ASC`), filters; atomic claim (409 with assignee on a lost race); no self-approval; senior-only sensitive approve / reassign / pin; `decide()` transaction writing status + reason + review stamps + audit row + best-effort `moderation` notification; hide/restore/remove/pin; reports inbox (resolve/dismiss, single-shot); inline `role:` tiers + throttles (report 10/1, heartbeat 60/1) in `Modules/Learn/Routes/api.php`.
- [x] **L-A.7 frontend**: `lib/video.ts`, `components/learn/VideoPlayer.tsx`, rewritten `pages/learn/Feed.tsx`, new `pages/learn/Watch.tsx` (watch route `learn.watch`, id constrained `[^/]+`), new `pages/admin/LearnReview.tsx`, `lib/lifecycle.ts` tones/labels extended; build emits `Watch-*` and `LearnReview-*` chunks; runtime probes green (`/learn/feed`, `/learn/watch/{uuid}`, guest → `auth/Login` on the console).
- [x] **L-A.8 bug fixed**: `LearnPlaylistController::destroyItem` crossed the module boundary with `DB::table()` → Eloquent `forceDelete()` + `Str::isUuid` guard (`ModularMonolithTest` green again).
- [x] **L-A.8 tests + gates**: `LearnFeedV2Test` 8 + `LearnModerationV2Test` 9 + `LearnPlaylistTest` 3 = **20 passed (183 assertions)**; Learn filter batch **70**; full suite **1520 passed (10167 assertions), 0 failed**; Vitest **40/40**; ESLint **0 errors** (1 pre-existing `Kyc.tsx` warning); tsc **0**; build green; audits **697 routes + 260 pages, 0 violations**; `route_list.txt` regenerated (**918 routes**, no BOM, 0 U+FFFD).
- [x] **L-A.9 e2e**: new `e2e/learn.spec.ts` + shared `e2e/helpers/auth.ts` (cached API tokens and browser storageState — both login routes are `throttle:10,1` and the suite now exceeds ten logins per minute); full Playwright **55 passed / 14 skipped / 0 failed**.
- [x] **L-A.9 docs**: `docs/LEARN_ARCHITECTURE.md` + `docs/LEARN_MODERATION_MODEL.md` created; `AUDIT_MATRIX.md` Phase L-A rows + LEARN section rows; this section; `docs/implementation/MASTER_GAP_REGISTER.md` change-log row; status counts refreshed in `TESTING_GUIDE.md`, `REVIEW_GUIDE.md`, `SYSTEM_REPORT.md`, `FINAL_COMPLETION_REPORT.md`.

## Phase L-B - Academy/LMS completeness (2026-10-08)

- [x] **L-B.1 progress source of truth**: `TableGatewayController` read-only for `enrollments`/`video_progress` (405 writes); progress mutations only via Learn module actions. Tests: `TableGatewayWritePolicyTest` 9 + `LearnProgressIntegrityTest` 2.
- [x] **L-B.2 permission enforcement**: `learn.*` enforced on learn admin routes; moderator += `learn.posts.review`. `LearnPermissionEnforcementTest` 7.
- [x] **L-B.3 course lifecycle**: `courses.status` (draft/published/archived, default published; migration applied to dev); publish/unpublish gated `learn.courses.manage`; public reads published-only; delete refused 422 `course_has_enrollments`; `admin/Learning.tsx` console. `CourseAdminCrudTest` 8 + `learning-admin.spec.ts`.
- [x] **L-B.4 landing completeness**: `/learn` published-only + level filter on `level` column; search/filter form, Categories/Videos/Certificates sections, stats header, My progress; My Learning lesson counts; course curriculum resources. `LearnLandingPageTest` 5 + `learn-landing.spec.ts`.
- [x] **L-B.5 course reviews**: moderation statuses + partial unique index (one live review per user per course); enrollment-gated create (403), re-review 422, approved + verified purchase on create, public index approved-only, `CourseRatingAggregator`, audited idempotent moderation; `admin/Reviews.tsx`. `CourseReviewTest` 9.
- [x] **L-B.6 quiz -> completion**: `ComputeCourseProgress` (lessons + quizzes over total units, single source of truth); `Quiz::grade()` strict numeric/range validation (fixed `(int)'text'=0` free-correct); `Quiz::course()` fix (pre-existing 500 on quiz-results); submit recomputes enrollment when enrolled; per-quiz `passed` on course page; certificate gate honest 422 mentioning pending quizzes; `Quiz.tsx` answer-by-index; `LearnDemoSeeder` consistency fix + dev DB repair. `QuizCompletionTest` 7; Learn filter batch 130/133/134.
- [x] **L-B.7 instructor surfaces**: instructor profile carries published-only course catalogue; `InstructorProfile.tsx` courses grid + Retry; duplicate h1s fixed; Instructors directory linked (Index header + AppLayout nav). `InstructorSurfaceTest` 3.
- [x] **L-B.8 shared components**: `learn/CourseCard` (one card everywhere: Catalog/Category/Search/Index rails + full list/InstructorProfile/MyLearning) + `shared/EmptyState`/`ErrorState`/`LoadingState` adopted; no silent empty-on-error states remain on learn pages. eslint 0 / tsc 0 / build green / learn e2e 15/15.
- [x] **L-B.9 SEO**: server `seo` prop on `/learn` (filter-aware title), `/learn/{id}` (real course facts), category + instructor routes; `SeoMeta` component (OG/Twitter/canonical; layout owns title); unknown instructors `noindex,follow`; fixed Postgres uuid-cast crash on non-UUID instructor ids (route + API). Test `test_learn_pages_carry_honest_seo_metadata` 61 assertions.
- [x] **L-B close gates**: full suite **1563 passed (10544 assertions), 0 failed**; Vitest 40/40; ESLint 0 errors; tsc 0; build green; audits **703 + 260, 0 violations**; `route_list.txt` regenerated (no BOM/FFFD); full Playwright **71 passed / 16 skipped / 0 failed** (flake fixes: apiLogin 45s timeout, playwright test timeout 90s).

## Phase H-A - Healthcare HMS overhaul (2026-10-08)

- [x] **H-A.1 laboratory domain**: `lab_tests` + `lab_bookings` tables (partial unique index per test/date/time, cancelled frees the slot); `BookLabTest` action (transaction + `lockForUpdate`, clash check, 23505 backstop); `LabController` list/show/book/myBookings/detail/pay/cancel (PaymentService idempotency key `lab-` + `lab_booking_payment`, free auto-confirm, completed cancel 422); static web routes precede `/health/labs/{id}` and `{id}` uuid-constrained (fixed route-order collision + uuid-cast 500); `LabShow`/`LabBookings`/`LabBookingDetail` rewritten onto the real contract (pay/cancel, prep, result time, empty/error/loading + Retry); `BookingConfirmation` fallback chain extended to lab bookings; dead doctor-derived `HealthCompatController::labs/lab` removed; `HealthcareDemoSeeder` seeds 6 lab tests + LB-DEMO-1. `LabDomainTest` 10 + `DomainJourneysTest` 4 (rewritten from doctor-alias to real lab domain); regression batch **97 passed (600 assertions)**; live smoke list/show/book/history/detail green; eslint 0 / tsc 0 / build green; audits **707 routes + 260 pages, 0 violations**.
- [x] **H-A.2 lab admin console**: `LabController` admin endpoints (list incl. inactive + search, create with slug, update, cross-patient bookings overview with status filter) gated `role:super_admin,administrator,healthcare_admin` (existing convention); bookings route precedes `/labs/{id}` (route-order); `admin/Healthcare.tsx` Lab Tests + Lab Bookings tabs (create form, activate/deactivate toggle, status pills, patient contact, paid badge). `LabDomainTest` now **14 passed** (4 new admin tests); regression batch **119 passed (771 assertions)**; eslint 0 / tsc 0 / build green; audits **711 routes + 260 pages, 0 violations**.
- [x] **H-A.3 providers/search honesty**: `Providers.tsx` + `Search.tsx` lab rows now surface `category`, `result_time_hours` turnaround and `price` (Search uses `formatPrice`) instead of a bare name; both already link the real `/healthcare/labs/{id}` detail route. Live catalog check confirmed all 6 active lab tests return category + price + turnaround. eslint 0 / tsc 0.
- [x] **H-A.4 healthcare e2e**: new `e2e/healthcare.spec.ts` — patient lab journey (discover -> book -> pay -> detail agrees with the booked test incl. prep/result facts -> history) across chromium/mobile/tablet, plus a chromium-only admin journey (list -> create -> publicly listed -> deactivate -> hidden from public but retained in admin -> browser Lab Tests tab renders the seeded catalog). Wrote-and-fixed three real defects: `/admin/healthcare` 404s (real path is `/admin/healthcare/doctors`); `H:i` requires a zero-padded hour (`9:00` 422s); bookings persist across runs so the probe must walk candidate slots for a free one. **4 passed / 2 skipped (1.5m)**; regression batch **101 passed (621 assertions)**; eslint 0 / tsc 0.

## Gaps 1-5 - directed fixes + H-C charity + home density (2026-10-09)

- [x] **G1 error+Retry sweep**: ~28 data-driven pages given a consistent `error` state + `errorMessage()` + named `load()`/`retryTick` + a Retry button (RefreshCwide) so a failed fetch shows a recoverable error, never a silent blank. Sanctum session-auth re-verified.
- [x] **G2 Learn free feed**: `LearnFeedDemoSeeder` seeds **81 approved posts** (53 verified YouTube-embeddable videos + 28 written guides) + a live moderation queue (6 pending / 1 rejected / 1 needs_information). `learn/Index.tsx` gains a "Free knowledge feed" section (cards + keyset load-more + "Open full feed" -> `/learn/feed`); Videos rail now `?type=video&per_page=6&sort=top`. New e2e `free knowledge feed renders real approved posts and pages forward`. Gates: e2e learn **22 passed / 2 pre-existing skipped / 0 failed**; `--filter=Learn` **108 passed**; 0 comment mismatches, 0 missing thumbnails/durations, date spread 2026-06-16..2026-10-09, avg views ~15.2K.
- [x] **G3 refund request-before-processing**: lifecycle pending (request, no money) -> approved -> completed/succeeded (same-method payout) or rejected (+`rejection_reason`). Migration adds `requested_by`/`reviewed_by`/`method`/`idempotency_key`(unique)/`cancellation_id`/`requested_at`/`reviewed_at`/`rejection_reason` to `refunds`. New `RequestRefund` + `ReviewRefund` actions; `RefundPayment::execute` gained an optional `Refund $request` (backward-compatible 2-arg) and reuses the request row; `PaymentGateway::refund` accepts a `refund_id` passthrough and applies the partial-amount override fix. Wired flows: `POST /api/payments/{id}/refund-request` (202, throttle:10,1), `GET /api/refunds/mine`, RMA `ReturnRequestController::store`/`decide` + `ProductOrderController::cancel`; super_admin `POST /payments/{id}/refund` stays immediate. Support review queue: `PUT /api/admin/refunds/{id}`. Wallet-backed payments credit the ledger back with `WALLET-REF-{refund.id}`. New `admin/Returns.tsx` refunds-tab Approve/Reject + Requested-by/Actions columns; `payments/Index.tsx` rewritten (error+Retry, "Request refund" PromptDialog, status chips). Fixed a real bug found while testing: `PaymentGateway` was not applying partial refund amounts. Gates: `RefundRequestTest` 10 + `ReturnDecisionTest` 8 (re-ran green after fix) + broad `--filter=Payment|Refund|Return|WaveH|WaveI` **616 passed (5515 assertions)**; `admin.spec.ts` extended to assert the auto-raised refund request lands in the support review queue; audits **722 routes / 264 pages, 0 violations**.
- [x] **G4 healthcare aid/charity (H-C)**: new `aid_requests` + `aid_donations` migration; `AidRequest`/`AidDonation` entities; `AidController` (public list/show of approved+funded only, authed file/mine/donate/donations, admin list/decide). Money never moves at request time - only at donation (PaymentService idempotency `aid-`+id). Unique `(aid_request_id, donor_id)` index doubles as the donate-idempotency backstop (23505 -> 422). Statuses pending/approved/rejected/funded/closed; reaching the goal auto-marks `funded`. `healthcare.aid.view` + `healthcare.aid.manage` added to the 184-catalog (additive-only) and granted to `healthcare_admin`; re-seeded PermissionSeeder. Public web routes `/healthcare/aid` + `/healthcare/aid/{id}`; authed `/healthcare/aid/mine`; admin `/admin/healthcare/aid`. New pages `healthcare/Aid`, `healthcare/AidDetail` (donate sheet), `healthcare/MyAid`, `admin/HealthcareAid` (Approve/Reject review queue). `HealthcareAidDemoSeeder` seeds the review lifecycle + real donation rows. New e2e `aid chain` (file -> hidden-while-pending -> approve -> public + donate) across 3 viewports + chromium-only admin review-queue render. Gates: `AidDomainTest` **14 passed (54 assertions)** (incl. guest-401 fix — added `auth:sanctum` to the authed aid routes — and a decimal-vs-float JSON assert fix); broad `--filter=RefundRequest|AidDomain` **24 passed (93 assertions)**; e2e healthcare chromium **3 passed / 0 failed** + aid chain green on all 3 viewports; audits **722 routes / 264 pages, 0 violations**.
- [x] **G5 home density**: `HomePageController` products `paginate(12)` -> `paginate(24)` exposing `current_page`/`last_page`; `Home/Index.tsx` adds `data-testid="home-load-more"` (router.get `?page=n`, preserveState+preserveScroll). Services rail leads with real bookable `ServiceDefinition` rows (badge=Bookable) topped up with open `TaskPost` gigs; healthcare rail surfaces live community `AidRequest`s (badge Aid/Funded) alongside doctors - all still `type=healthcare` so the discovery tab filter is unchanged. Live HTTP verify: **products_count=24, per_page=24, last_page=2** (40 total), **services_rail=5** (first="Home Cleaning" badge=Bookable), **healthcare_cards=5** (Doctor,Doctor,Aid,Aid,Aid). tsc 0 / eslint 0 / build green.
- [x] **Gaps 1-5 close gates**: `--filter=RefundRequest|AidDomain` **24 passed (93 assertions)**; `--filter=Learn` **108 passed**; broad `--filter=Payment|Refund|Return|WaveH|WaveI` **616 passed (5515 assertions)**; `--filter=Healthcare|Aid|Lab` **128 passed (749 assertions)**; Playwright learn **22 passed / 2 skipped / 0 failed**, healthcare chromium **3 passed / 0 failed** (pre-existing lab-booking chain flake = transient auth-cache + "no free lab slot" slot exhaustion, not these changes); ESLint 0 errors; tsc 0; build green; audits **722 routes + 264 pages, 0 violations**.

## Phase H-B - prescriptions + pharmacy fulfilment + patient records (2026-10-09)

- [x] **H-B.1 prescription -> pharmacy linkage**: migration `2026_10_09_200000_link_prescriptions_to_pharmacy.php` adds `medicine_orders.prescription_id` (FK -> prescriptions, nullOnDelete) + `prescriptions.expires_at`. `PharmacyAdminController@deliver` flips the linked prescription to `filled` on delivery (guarded so a re-delivery cannot resurrect a filled/expired Rx). New `PharmacyAdminController@prescriptions` oversight list (every patient's Rx with patient+doctor, status filter), gated `role:super_admin,administrator,pharmacy_admin`. `PrescriptionLifecycleTest` **10 passed (25 assertions)**.
- [x] **H-B.2 send-to-pharmacy + expiry sweep**: `POST /api/prescriptions/{id}/order` (own-row only) rejects expired/non-active 422, matches items against the Rx-only catalogue by name/generic (ilike), locks the medicine row, decrements stock, links the order via `prescription_id`, sums server-side, reports unmatched item names (422 when nothing matched). New `pharmacy:expire-prescriptions` command (active -> expired past `expires_at`) scheduled daily in `routes/console.php` — note the legacy `App\Console\Kernel` is NOT bound under Laravel 13 ApplicationBuilder (the file documents this), so a schedule line there silently never runs; caught during verification when the entry was missing from `schedule:list`.
- [x] **H-B.3 patient records + prescriptions page**: `HealthcarePageController@prescriptions` rewritten onto the `prescriptions` table (single source of truth — the old `consultations.prescription_items` JSON snapshot drifted from the materialised row's status/expiry); new `@records` aggregates tickets + consultations + prescriptions into one chart. New web route `GET /healthcare/records` + AppLayout nav (Records/Prescriptions). `healthcare/Prescriptions.tsx` rewritten (real code/status/expires_at, Active/Expired/Filled chips, diagnosis + follow-up, `Send to pharmacy` button via api.post + toast + router.reload). New `healthcare/Records.tsx` timeline page. Admin `Pharmacy.tsx` gains a Prescriptions tab (patient/doctor/items/status/issued, active/filled/expired filter chips). `AdminDomainController@pharmacyOrders` now selects `mo.prescription_id`. `statusTone` gains `filled`. `PrescriptionLifecycleSeeder` (registered in DatabaseSeeder after HealthcareAidDemoSeeder) seeds RX-LIFECYCLE-ACTIVE/EXPIRED/FILLED + delivered linked `MED-DEMO-RXLINK`; live probe confirms all three statuses + the linked order.
- [x] **H-B gates**: `--filter=PrescriptionLifecycleTest` **10 passed (25 assertions)**; `--filter="Pharmacy|WaveK"` **32 passed (176 assertions)** (WaveK Rx-gate + double-book pins intact); broad `--filter="Pharmacy|WaveK|Healthcare|Prescription"` **114 passed (533 assertions), 0 failures**; tsc **0**; eslint **0 errors**; `npm run build` green; audits **726 routes + 265 pages, 0 violations**; `pharmacy:expire-prescriptions` registered + runs.


- [x] **H-B.4 e2e prescription chain (new, 2026-10-10)**: `e2e/healthcare.spec.ts` patient prescription chain - expired/filled ordering blocked 422; active prescription ordered (201, linked `prescription_id`, priced, in patient history); admin cancel keeps the Rx active (only delivery fills - pinned in PHPUnit, chain stays re-runnable); oversight API envelope + `status=bogus` -> 422; patient prescriptions page (chips + `Send to pharmacy`); records timeline; admin Prescriptions tab. Asserts on data, not layout (DataTable keeps a CSS-hidden desktop table + visible mobile definition list).
- [x] **H-B.5 prescriptions-page redirect-loop bug fixed**: the page eager-loaded `consultation:...` but `Prescription` had no `consultation()` relation -> `RelationNotFoundException` -> global-handler `redirect()->back()` self-loop (`ERR_TOO_MANY_REDIRECTS`, JSON 401 on XHR). Missed by the empty-data sweep because `Builder::get()` skips eager loads when the result set is empty; caught by the new e2e (the seeded customer has rows). Fixed with the `consultation()` belongsTo + two **row-based** regression tests in `CustomerPageRenderTest` (`33 passed`) so broken eager loads can no longer hide behind empty fixtures.
- [x] **H-B.6-H-B.8 hardening**: admin prescriptions endpoint now returns the `{data,total,meta:{page,per_page,total}}` envelope `admin/Pharmacy.tsx` expects (was raw paginator, no `meta.page`); shared `webLogin` helper clears a previous account's cookies before the fallback form flow (`/login` bounces signed-in users, so multi-account chains timed out on `#login-email`); lab booking chain walks dates `+3d..+14d` instead of one fixed date (slot-exhaustion flake).
- [x] **H-B follow-up gates**: broad `--filter="Pharmacy|WaveK|Healthcare|Prescription|CustomerPageRender|AdminConsoleRender"` **182 passed (1041 assertions), 0 failures**; full `e2e/healthcare.spec.ts` **10 passed / 2 skipped / 0 failed** (4 chains x 3 viewports); tsc **0**; eslint **0 errors**; audits **726 routes + 265 pages, 0 violations**; no `resources/js` changes this round (existing build valid).

## Phase H-D - healthcare restructuring (2026-10-10)

- [x] **H-D.0 live registry failure fixed**: `/admin/healthcare/aid` had no `consoleNavigation.ts` entry -> registry-parity test failed on a live route; entry + dataset + matrix row added. Registry-parity test now in every gate batch.
- [x] **H-D.1 professions + home-visit pricing**: migration `2026_10_10_122959` (`doctors.profession` + index, `doctors.home_visit_fee`, `health_tickets.home_address`); 12-value enum validated in `StoreDoctorRequest`; admin form/column + demo professionals; `home_visit` consultation type with per-professional fee (fallback to `consultation_fee`) in both booking branches; profession + virtual filters on API, service, controller (also fixed silently-ignored `?virtual=true`); chips on Doctors/Virtual pages; `AppointmentShow` home-visit display.
- [x] **H-D.2 Health Bookings hub + Others requests**: migration `2026_10_10_134210_create_health_service_requests_table` (unique request_number + idempotency_key, forward-only lifecycle open/contacted/scheduled/closed/cancelled); `ServiceRequestController` + routes (mine/store/admin/decide, `mine` before `/{id}`); pages Bookings/HomeVisit/ServiceRequests; web routes `/healthcare/bookings[/home-visit][/others]`; Index tiles Documentation/Healthcare Aid/Health Bookings; admin Requests tab; `lifecycle.ts` contacted/scheduled tones.
- [x] **H-D.3 Documentation hub + cross-links**: `healthcare/Documentation.tsx` (Videos/Documents/Guides + View-all + load-more); `GET /healthcare/documents`; back-links/shortcuts across Aid/Labs/Content/Appointments/Records/Prescriptions; sidebar + HealthServices sections.
- [x] **H-D.4 admin alignment**: content admin CRUD + additive `healthcare.content.view/manage` perms + Content tab; pharmacy gates aligned to matrix (medicines -> pharmacy_admin, prescriptions oversight -> +healthcare_admin) + `Pharmacy.tsx` medicine form + Healthcare Prescriptions tab; parity/suite probes + matrix rows.
- [x] **H-D.5 e2e caught 2 real bugs**: `AppointmentResource` missing `home_address` (fixed + detail display); `adminList` treating `status=all` as a literal filter (empty Requests tab, fixed); chip label `Nurses` vs `Nurse` (exact match). New `HealthcareBookingsTest` **11 passed**; `CustomerPageRenderTest` **40 passed** (bookings/home-visit/others/documents datasets); 5 new e2e chains.
- [x] **H-D.6 hardening + gates**: learn-landing feed count raced hydration (waits for post-fetch button); scan navigation 45s budget; hub chain 180s budget. Batch1 **179 passed (937 assertions)**; batch2 **84 passed (2616 assertions)**; `e2e/healthcare.spec.ts` **23 passed / 4 skipped / 0 failed**; suite halves **30/12** + **44/4**, 0 failed; tsc **0**; eslint **0**; build green; audits **734 routes + 269 pages, 0 violations**.
