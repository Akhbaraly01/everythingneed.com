# PHASE 05 — ACCOUNT, IDENTITY, RBAC, WORKSPACES

Status: audit complete; regression gate running below.

## ACCT-01 Audit (2026-10-13)

- Domain: `Modules/Authentication` (32: Sanctum login/register/logout,
  OTP, TOTP 2FA, sessions/token revocation, suspend/appeal) +
  `Modules/Users` (15: profile/addresses/account) + `Modules/Settings`
  (6: preferences, 8-language/currency/theme globalization).
- Pages: account center (16: dashboard, profile, security, sessions,
  payment methods, privacy, orders, bookings, reviews, KYC, wallet…),
  settings (3), auth (7: login/register/reset/2FA-challenge/verify/
  suspended).
- RBAC: 184-grant catalogue (additive-only), downhill-only grants, no
  self-escalation, scope/ownership enforcement, permission-derived admin
  nav (`admin/Rbac.tsx`, `permissions/Index.tsx`).
- Workspaces: server-side resolver (customer/vendor/worker/admin landings).
- Recalled systems (§5.5): Auth0/Keycloak lifecycle + MFA, Firebase social
  auth, Clerk UX, shadcn/Radix accessible admin patterns. Catalogue
  mapping only; no live visits claimed.

## ACCT-02..10 — implemented in prior waves, re-verified here

Registration→verify→profile→preferences→history→deletion policy; session
management + revocation + TOTP + throttles + recovery; workspace routing;
RBAC matrix + consoles; globalized preferences; reset/appeal flows.

## ACCT-11 Regression gate

- Authentication suites, Users/Settings suites, RBAC suites
  (RbacLifecycle, RbacMatrix, PermissionMiddleware/Scope, AuthRbac
  Hardening, RoleEscalation, UserPermissionGrants).
- `e2e/admin.spec.ts` (console access + home-sections), workspace
  landing coverage, account-pages specs.

## Re-verification (programme execution, this session)

- Authentication suites: **47 passed**.
- RBAC + Users + Settings: **79 passed**.
- Admin/account e2e (chromium): **6 passed**.

**TRACK E GATE: CLOSED.**
