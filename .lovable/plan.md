
# Enterprise Architecture Enforcement — Phased Refactor Plan

This work touches hundreds of files across 35+ modules. Doing it in a single pass would almost certainly break the build in multiple places at once and make recovery hard. I'll execute it in five reviewable phases, each independently shippable and CI-gated.

## Scope summary

1. Route all HTTP through `@core/api/RequestBuilder` (`http`) — no direct `supabase`/`fetch` in modules.
2. Force modules to depend on `@core/contracts` interfaces, not concrete services.
3. Replace duplicated pricing/tax/commission/wallet/notification logic with `@core/engines`.
4. Migrate every form/validator to `@shared/validators` rules.
5. Add unit + integration tests for `@core/security` (sanitization, escaping, hashing, HMAC, rate limiting).

## Phase 1 — API Layer Enforcement

- Extend `RequestBuilder` with a thin `supabaseQuery()` adapter so modules can run typed Postgrest queries through one chokepoint (auth header, retries, cache, audit hook).
- Add ESLint rule inside `src/modules/**`:
  - Disallow `import { supabase } from "@/integrations/supabase/client"` (already partly blocked — extend to `@core/api/client`'s raw export too).
  - Disallow bare `fetch(` and `axios` in modules (`no-restricted-globals` + `no-restricted-imports`).
  - Allow only `import { http } from "@core/api"`.
- CI: `scripts/check-api-usage.mjs` greps `src/modules/**` for forbidden patterns, fails build on hit.
- Codemod migrate healthcare module first (smallest blast radius, already migrated structurally). Other modules' page files still living under `src/pages/**` are out of scope for this phase — they'll be flagged but not rewritten until they move into a module.

## Phase 2 — Contracts-Only Dependencies

- Audit `@core/contracts` and add any missing interfaces (`AuthService`, `PaymentService`, `NotificationService`, `StorageService`, `SearchService`, `AnalyticsService`, `AuditService`, `CacheService`).
- Implement concrete adapters under `src/core/services/*` (not exported from `@core` barrel — only contracts are).
- Add a tiny DI registry `src/core/di/container.ts` with `register/resolve<TContract>()`.
- ESLint rule: inside `src/modules/**`, forbid `@core/services/*` imports — only `@core/contracts` + `resolve()`.
- CI: extend `check-api-usage.mjs` with the contracts rule.

## Phase 3 — Engines Consolidation

- Inventory duplicated logic across `checkout`, `pharmacy`, `orders`, `payments`, `wallets`, `vendors`, `notifications` (price math, tax, commission %, wallet credit/debit, notification dispatch).
- Replace inline math with `PricingEngine.calculate(...)`, `TaxEngine.apply(...)`, `CommissionEngine.split(...)`, `WalletEngine.debit/credit(...)`.
- Notifications: route through `NotificationService` contract (Phase 2) backed by a single dispatcher that fans out to in-app, push, email.
- Add unit tests for each engine covering edge cases (zero, negative, rounding, currency).

## Phase 4 — Validators Consolidation

- Expand `src/shared/validators/index.ts` with: `PhoneValidation`, `NameValidation`, `DescriptionValidation`, `UrgencyEnum`, `PrescriptionFileValidation`, `BookingRequestSchema`, `CheckoutSchema`.
- Migrate forms one module at a time:
  - `src/components/booking/InlineBookingForm.tsx` → `BookingRequestSchema`
  - `src/pages/pharmacy/CheckoutPage.tsx` → `CheckoutSchema`
  - Healthcare booking, needs submit, auth OTP, vendor registration, etc.
- ESLint rule: forbid `z.object(` declarations inside `src/modules/**` and `src/pages/**` — must import from `@shared/validators`.
- Allow opt-out via `// eslint-disable-next-line shared-validators` with a justification comment, tracked in CI count.

## Phase 5 — Security Test Suite

- Add Vitest tests in `src/core/security/__tests__/`:
  - `sanitize.test.ts` — XSS payloads, null bytes, unicode confusables.
  - `escape.test.ts` — HTML/JS/URL contexts.
  - `hash.test.ts` — SHA-256 known-answer tests, HMAC sign/verify round-trip, tamper detection.
  - `rateLimiter.test.ts` — window expiry, burst, key isolation, concurrent calls (fake timers).
- Add an integration test: a mock endpoint wired through `RequestBuilder` that exercises sanitize → HMAC sign → rate-limit → response.
- Wire `bunx vitest run src/core/security` into the `module-boundaries` workflow; fail build on regression. Add coverage threshold (≥90% statements/branches for `src/core/security/**`).

## Risks & mitigations

- **Build breakage**: each phase is one PR-sized change set; I run typecheck + targeted vitest + the existing structure/contracts scripts after every phase.
- **Hidden direct-supabase usage in `src/pages/**`**: these files aren't inside modules yet, so ESLint won't catch them. The new `check-api-usage.mjs` will *report* them as warnings but not fail, until they're migrated into modules.
- **Engine semantics drift**: before deleting any duplicated math, I diff against the engine output with a golden-value test to prove parity.

## Deliverables per phase

Each phase ends with: code changes, new/updated tests, CI script update, and a one-line summary of what's now enforced.

## Ask before I start

Do you want me to execute **all five phases sequentially in this turn** (long, higher risk of mid-flight failures), or **start with Phase 1 only** and pause for review before Phase 2?
