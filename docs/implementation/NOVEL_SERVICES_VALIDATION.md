# NOVEL SERVICES LAB — VALIDATION REGISTER (§7)

Status: validation TODOs completed as analysis deliverables (2026-10-17).
Per the master prompt: **none of these are promised as built**; each requires
demand evidence + fraud analysis + cost model before any code. This register
records that analysis against the verified system state. No fabricated market
data: where evidence cannot be produced from the repository alone, the
required evidence is named explicitly and the decision stays conservative.

Legend: **BLOCKED-BY-BUSINESS** · **POSTPONE** (revisit when evidence
exists) · **ADAPT** (incremental path onto existing infrastructure, still
gated on validation).

---

## 1. Single-cart multi-vertical checkout

- **What it is:** products + service bookings + course seats in one order
  with split fulfillment and per-line lifecycles.
- **Existing building blocks (verified):** Orders module (`Modules/Orders`)
  with per-order lifecycle + returns/RMA; needs bookings
  (`Modules/Needs/Entities/NeedBooking.php`); Learn enrollments
  (`Modules/Learn/Entities/Enrollment.php`); checkout in
  `Modules/Checkout`; wallet holds/refunds (`Core/Services/WalletService.php`).
- **Demand evidence:** REQUIRED — none exists in-repo. Needs order data
  showing multi-vertical baskets (users buying a product and booking a
  service in the same session) from real traffic before build.
- **Fraud analysis:** high risk — split fulfillment multiplies partial-refund
  and chargeback edge cases; per-line dispute paths must reconcile against
  one payment intent. Current per-module lifecycles (order/booking/
  enrollment) are deliberately separate; merging carts without a unified
  fulfillment state machine would create ambiguous money states.
- **Cost model:** very high — new aggregate (Cart), split-payment
  allocation ledger, per-line lifecycle engine, refund allocation rules,
  plus migration of 3 checkout paths. Largest item in this register.
- **Decision:** **POSTPONE**. Revisit only with real basket-composition
  data and a designed split-refund allocation model.

## 2. Skill-barter exchange

- **What it is:** trade lessons/services without money on a ledger (hours
  banked, completion-verified).
- **Existing building blocks (verified):** double-entry-style wallet ledger
  (`app/Models/WalletTransaction.php`, `Core/Enums/WalletTransactionType.php`,
  `Core/Services/WalletService.php`); verified completion exists per-domain
  (Learn progress/quizzes; needs offer→booking→completion).
- **Demand evidence:** REQUIRED — no signal in-repo; barter economies need
  liquidity (enough both-sided inventory) which a new platform cannot assume.
- **Fraud analysis:** severe sybil/farming exposure — free accounts could
  farm hours via self-matched pairs; needs identity cost (KYC-gated barter,
  `Core/Support/KycGate.php`) + anti-collusion matching review before any
  ledger entry.
- **Cost model:** medium engineering (hours ledger on existing wallet
  patterns) but high operational (dispute resolution for non-monetary value,
  abuse review). Tax/accounting treatment of barter is unresolved.
- **Decision:** **POSTPONE**. If revisited: KYC-gated, capped balances,
  completion-verified only, no cash-out.

## 3. Blind donor allocation pool

- **What it is:** donors fund a pool; a blinded committee matches verified
  cases without seeing identities.
- **Existing building blocks (verified):** healthcare aid applications with
  evidence review + consent-gated public summaries; donor unlinkability
  option (aid anonymity tests in `tests/Feature/Healthcare/`); allocation
  ledger + receipts (HEALTH-09 completed).
- **Demand evidence:** REQUIRED — depends on aid volume; pooling only makes
  sense above a caseload where individual campaigns fail to fund.
- **Fraud analysis:** mitigated by design (blinding + committee), but the
  committee itself becomes a trust bottleneck: needs member vetting, quorum
  rules, and audited decisions (existing audit hash-chain applies).
- **Cost model:** medium engineering (pool ledger + blinded matching queue)
  + high operational (committee staffing — human process, not code).
- **Decision:** **POSTPONE** pending aid volume; committee operations must
  be staffed before code is written.

## 4. Prescription-to-door with interaction guard

- **What it is:** upload Rx → pharmacist verification → interaction check
  against profile → tracked delivery.
- **Existing building blocks (verified):** Pharmacy module
  (`Modules/Pharmacy/Entities/Prescription.php`, `Medicine.php`), cart
  checkout, delivery tracking, pharmacist-role separation (HEALTH-08/10
  completed).
- **Demand evidence:** partially exists (pharmacy orders + prescription
  linkage shipped); the *interaction guard* specifically has no demand
  evidence yet.
- **Fraud analysis:** prescription forgery/duplication — already covered by
  pharmacist verification; interaction check adds clinical liability, not
  fraud risk. Clinical liability is the binding constraint.
- **Cost model:** the guard requires a licensed drug-interaction database
  (commercial license + regular updates) — recurring third-party cost, plus
  clinical governance for false positives/negatives. Cannot be
  hand-rolled; must not be faked.
- **Decision:** **POSTPONE** pending a licensed drug-interaction data
  provider and clinical sign-off. The delivery pipeline itself already
  exists.

## 5. Learn-to-earn micro-credentials

- **What it is:** verified certificates convert to marketplace credit at
  configured rates (anti-farm caps).
- **Existing building blocks (verified):** certificates with unique codes
  (`Modules/Users/Entities/UserCertificate.php`,
  `Modules/Learn/Actions/IssueCertificate.php`), quiz-gated completion
  (`Quiz.php`, `QuizAttempt.php`, strict grading), wallet credit
  (`WalletService`), marketplace credit would flow through existing wallet.
- **Demand evidence:** REQUIRED — conversion rates and credit economics
  need real course completion + redemption data; setting a rate without
  data risks arbitrage.
- **Fraud analysis:** farming is the whole risk: self-paced courses are
  cheap to automate. Caps required: per-user credit ceilings, one
  conversion per certificate, completion validation already enforced,
  course-cost ≥ credit-value invariant to kill arbitrage, velocity limits
  via existing `MutatingRateLimit`.
- **Cost model:** low-to-medium engineering (conversion action + caps on
  existing wallet); the real cost is economic (credit liability on the
  balance sheet).
- **Decision:** **ADAPT** — smallest viable path; build only after course
  completion volume exists and an economic cap model is approved.

## 6. Milestone escrow with arbitration

- **What it is:** need funds release per milestone; rules + human
  arbitrators, both sides audited.
- **Existing building blocks (verified):** wallet holds + refunds; needs
  lifecycle with server-enforced transitions; audit hash-chain
  (`Core/Support/AuditChain.php`). No escrow/milestone code exists.
- **Demand evidence:** tracked as N-20/N-21 in the backlog; blocked on
  business decisions (fees, float handling, arbitrator terms).
- **Fraud analysis:** escrow concentrates money-flow risk; requires legal
  framework for holding funds (licensing), arbitrator impartiality rules,
  and evidence standards — all operational/legal, not technical.
- **Cost model:** high — money transmission/float compliance dominates.
- **Decision:** **BLOCKED-BY-BUSINESS** (P4). Do not build until legal
  framework and arbitration operations are approved.

## 7. Verified-provider passport

- **What it is:** one KYC/worker verification valid across jobs, tasks, and
  services verticals.
- **Existing building blocks (verified):** KYC controller + gate
  (`app/Http/Controllers/Api/KycController.php`, `Core/Support/KycGate.php`,
  `KycStatus.php`), provider profiles with per-vertical verification
  (`Modules/Needs/Entities/NeedProviderProfile.php`), worker/job-seeker
  verification (Jobs/JobSeekers modules), signed private storage for
  documents (`Core/Services/SignedStorageService.php`).
- **Demand evidence:** internal — duplicated verification per vertical is
  observable in the data model; unification reduces provider friction
  (real, measurable onboarding drop-off evidence still REQUIRED).
- **Fraud analysis:** centralizing verification raises the value of one
  compromised identity — mitigated by the existing signed storage, audit
  chain, and PII encryption; must keep per-vertical *additional* checks
  (e.g., clinical credentials) on top of the passport.
- **Cost model:** medium — a Core contract (`ProviderPassportInterface`)
  + module-owned services, following the established
  `LearnCatalogInterface` migration pattern. No new storage tech.
- **Decision:** **ADAPT** — architecturally the cleanest fit; sequence as a
  Core-contract migration when onboarding-friction data justifies it.

## 8. Community price oracle

- **What it is:** crowdsourced local price benchmarks flagging gouging on
  products and services.
- **Existing building blocks (verified):** cost guides
  (`Modules/Needs/Entities/NeedCostGuide.php` +
  `NeedCostGuideController`, admin-managed); quote estimator
  (`QuoteEstimator.php`); reviews with verified-transaction gating.
- **Demand evidence:** partially exists (cost guides are live); crowdsourced
  contribution volume is REQUIRED before replacing/merging curated data.
- **Fraud analysis:** price manipulation by interested parties (vendors
  submitting fake benchmarks) — requires verified-transaction provenance
  (only actual payers can submit), outlier trimming, and moderation queue
  (existing admin moderation patterns).
- **Cost model:** low-to-medium — extends existing cost-guide entity with
  submission + provenance + moderation; no new infrastructure.
- **Decision:** **ADAPT** — extend curated cost guides with
  verified-payer submissions once contribution volume exists.

---

## Summary

| # | Candidate | Decision |
|---|---|---|
| 1 | Single-cart multi-vertical checkout | POSTPONE |
| 2 | Skill-barter exchange | POSTPONE |
| 3 | Blind donor allocation pool | POSTPONE |
| 4 | Prescription-to-door interaction guard | POSTPONE (licensed data) |
| 5 | Learn-to-earn micro-credentials | ADAPT (after volume + caps) |
| 6 | Milestone escrow + arbitration | BLOCKED-BY-BUSINESS |
| 7 | Verified-provider passport | ADAPT (Core-contract migration) |
| 8 | Community price oracle | ADAPT (extend cost guides) |

No candidate is built. ADAPT decisions name the incremental path and its
validation gate; POSTPONE/BLOCKED items stay untouched until their stated
evidence or business approvals exist.
