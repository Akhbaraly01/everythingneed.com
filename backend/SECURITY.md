# SECURITY.md — EverythingNeed security runbook

Threat model: stolen DB/backup · network sniffer/MITM · compromised module
· abusive users/bots. One control per threat, each pinned by a test or a
`security:posture` check. Run `php artisan security:posture` after every
deploy; it fails loudly on insecure posture.

## 1. Key custody & rotation (APP_KEY)

- PII rests AES-256-GCM encrypted: `two_factor_secrets.secret`,
  `kyc_verifications` identity columns, `payments`/`refunds` payloads.
- Never commit keys. Custody: `.env` `APP_KEY` (no KMS yet — interfaces are
  `Crypt`-backed, so a KMS envelope is a drop-in later).
- Rotate without a plaintext window:
  1. `php artisan security:encrypt-pii --dry-run` (expect errors=0)
  2. Set `APP_PREVIOUS_KEY=<retired key>`, deploy new `APP_KEY`
  3. `php artisan security:encrypt-pii` (re-encrypts retired-key rows)
  4. `php artisan audit:verify-chain` (must report intact)
  5. Unset `APP_PREVIOUS_KEY`, redeploy, re-run posture (checks unset)
- TOTP secrets additionally rotate on every 2FA enable; QR codes render
  in-process (`Core\Support\TotpQrRenderer`) — secrets never leave in URLs.

## 2. Transport & edge

- Prod requires: `APP_DEBUG=false`, `DB_SSLMODE=require` (+ CA),
  `SESSION_SECURE_COOKIE=true`, `BROADCAST_CONNECTION=reverb` (+ `reverb:start`),
  real `PAYMENTS_DRIVER` + webhook secrets, `TURNSTILE_SECRET` +
  `VITE_TURNSTILE_SITE_KEY`.
- Lifetimes by design: web sessions 120m, Sanctum tokens 480m with the
  sessions/token revocation UI (single + bulk revoke).
- Rate layers: global 240/min IP → mutation window 120/min per actor →
  route-explicit throttles (auth 6–10/min, money 10–30/min). Never raise the
  mutation window without re-running the abuse suites.
- Webhook secrets empty = fail-closed outside local/testing. Mock payments
  are blocked in production at the gateway constructor.

## 3. Domain isolation & signed communication

- Modules talk cross-domain only via `Core` contracts or signed events;
  `ModuleDependencyTest` fails new direct references (allowlist only shrinks;
  regenerate with `php scripts/scan-module-deps.php --allowlist`).
- Money events (`PaymentCompleted`, `RefundProcessed`) are HMAC-signed at
  dispatch; listeners reject forgery/replay with an `event.rejected` audit
  row. Broadcast payloads carry IDs only (no bodies on the socket).
- Audit trail is hash-chained (`audit:verify-chain` daily via schedule).
  Legacy pre-chain rows report, never fail. A break means edit/delete/reorder
  — treat as an incident (Section 5).

## 4. Abuse detection

- `security:detect-anomalies` (daily): login bursts (≥10/IP/h), grant
  bursts (≥10/actor/h), refund spikes (≥5/actor/h) → `anomaly.*` audit rows,
  deduplicated per window. Alerts only — enforcement stays in throttles and
  RBAC. Tune thresholds in `DetectAnomalies` for the traffic profile.
- Donor unlinkability: anonymous aid donations hide donor identity publicly;
  donor/owner/staff still resolve (receipts, refunds, fraud review).

## 5. Incident checklist

1. `security:posture --verify-audit` — if the chain is broken, snapshot the
   DB first (`pg_dump`), then diff `audit_logs` sequence gaps.
2. Rotate `APP_KEY` (Section 1) if exfiltration is suspected; revoke
   sessions/tokens for affected users (`DELETE /api/auth/tokens`).
3. Suspend accounts (`POST /api/admin/users/{id}/suspend`), preserve
   `audit_logs` + `storage/logs/audit.log` (30-day retention).
4. Post-mortem updates this file and adds a regression test.

## 6. Pre-deploy gate (CI order)

`composer audit` → PHPUnit full → `npm run lint` → `tsc --noEmit` →
`npm run build` → `npm run test:unit` → Playwright → `security:posture`.
