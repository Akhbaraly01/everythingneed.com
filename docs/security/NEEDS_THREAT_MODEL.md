# NEEDS Threat Model — TODO 24

Scope: needs domain attack surface, verified against code 2026-10-15.
Global platform controls (Turnstile, throttles, encryption, audit chain)
live in the security suites; only needs-specific findings below.

## Enforced (pinned by tests)

- Ownership on every write: requests, offers, bookings, profiles, listings,
  disputes, saved items, reviews — strangers get 403/404, guests 401.
- State machines are server-owned: clients never write status; moderator
  powers derive from roles per action; published content freezes under bids.
- Money: server-side amounts, idempotency keys (NRPAY-*/NEEDPAYOUT-*), signed
  webhooks with insert-first dedupe, signed PaymentCompleted events with
  per-listener nonces, refund-only-through-dispute for needs.
- Races collapsed in the database: locked accept (single winner), locked
  overlap checks, partial unique index (one live booking), unique
  (owner, client_key), unique (offer, revision), unique (review, reporter).
- Uploads: 10 MB cap, allowlisted mimes (no SVG/HTML), user-scoped paths,
  traversal-guarded deletes, finfo MIME, image downscale pipeline.
- Search/discovery: unified search returns published+public rows only;
  invite-only and drafts never leak; per-endpoint permission gates.
- Exports: PII-free columns, formula neutralization, audit-logged.
- Events: signed envelopes, freshness window, per-consumer single-use
  nonces; forgery/tamper/replay fail closed with audit rows.

## Known limitations (explicit, not hidden)

1. No malware scanning on uploads (no scanner in this environment).
   Mitigations in place: mime allowlist + size cap + no-execute storage.
2. Attachments live on the public disk behind unguessable paths — obscurity,
   not authorization. Private-by-link today; signed-URL migration is the
   queued follow-up (also covers dispute evidence + KYC-adjacent files).
3. mp4/webm served from public disk: browsers sniff; keep allowlist tight,
   serve with stored content types.
4. DB session timezone is not pinned to UTC (server default observed:
   America/Los_Angeles). All needs datetime logic normalizes to naive UTC
   in PHP, immune to the session setting; a global `SET TIME ZONE 'UTC'`
   is recommended follow-up for other domains' timestamptz columns.
5. Fraud flags are heuristic signals for human review, never auto-punish;
   thresholds are constants awaiting operational tuning data.
6. Matching v1 uses profile + engagement signals only (no review-rating
   signal yet); weights are documented constants.
7. Hourly billing, milestone escrow ledger, and arbitration are built
   (2026-10-21) with the money-path controls that matter: every leg
   carries a stable idempotency key, a milestone plan can never exceed the
   agreed price, an arbitration award can never exceed the held amount,
   refunds are idempotent, and each money event writes an audit-chain
   entry. The residual risk is legal/operational (holding funds,
   arbitrator impartiality, evidence standards), not technical.

## Performance posture

- Discovery indexes: need_requests(status,visibility,created_at) +
  (category,status); task_posts(status,created_at);
  need_items(status,available,category).
- Bulk preloads replace per-row KYC/history queries in matching and the
  providers queue (3 queries total regardless of page size).
- Paginated lists cap per_page ≤ 100; exports stream chunked (500/chunk).
- ILIKE %term% scans are unindexed by nature (pg_trgm not provisioned);
  acceptable at current scale, flagged for revisit with volume.
