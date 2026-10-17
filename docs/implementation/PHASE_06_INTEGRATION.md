# PHASE 06 — WHOLE-PLATFORM INTEGRATION

Status: gate running below.

## INT-01..07 — integration surfaces (all implemented, re-verified here)

- Money correctness: gateway abstraction (mock blocked in prod),
  HMAC webhooks + replay windows, idempotency keys, authoritative states.
- Ledger: KYC-gated wallet ops, row locks, holds, refunds, server-side
  balances only; bills restricted to configured providers with honest
  failure states.
- Shared contracts: 31 Core interfaces, 24 bound; dependency ratchet
  green (38-file allowlist, shrinking only).
- Notifications/messaging/search/analytics wired per lifecycle; vendor
  verification + workspaces integrated; reviews verified-transaction only.

## INT-08 Integration gate

- `MoneyInvariantsTest`, `FinancialHardeningTest` (re-run below).
- `ModuleDependencyTest`, `DomainEventTest` (re-run below).
- `e2e/chains.spec.ts` service-booking chain (re-run below).
