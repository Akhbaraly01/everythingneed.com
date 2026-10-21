# Spec-marker audit — the 52 `TODO nn` comments in the backend

**Date:** 2026-10-21
**Scope:** every `TODO nn` marker in `backend/app`, `backend/Modules` and
`backend/Core`.
**Question:** are these unimplemented gaps, or traceability annotations?

## Result

**All 52 markers are traceability annotations, and every one of them has
its implementation directly below it.** None is a stub.

The audit was mechanical and reproducible:

```php
// for each marker, look at the code that follows (comment lines skipped)
$code = first non-comment line within the next 25 lines
```

```
spec-traceability markers with code below: 52
markers with NO code directly below: 0
```

A proximity check alone would be weak evidence, so each marker was also
read against the code it introduces. The distinct spec sections they cite
and where each one lives:

| Spec | Subject | Implementation |
|---|---|---|
| 05 | single category + question schema | `NeedController::category()` reads the category schema snapshot; `NeedRequestController` validates answers against the allowlisted schema |
| 06 | invitation-only visibility | `NeedRequestController::index()` filters invite-only rows; `show()` hides them from strangers |
| 07 | idempotent submission / revisions | `client_key` replay check in `store()`; `update()` owns the revision rules |
| 08 | provider eligibility | suspension / flagged-category / KYC gates in `submitOffer()` |
| 09 | listing states | `NeedController::store()` creates listings as draft; `deals()`/`deal()` only expose eligible ones |
| 10 | discovery filters | validated, allowlisted sort in `index()` |
| 11 | explainable matching | `matches()` ranks eligible providers; `myMatches()` annotates the provider side |
| 12 | offer revisions / withdrawal / atomicity | `withdrawOffer()`, `OfferRevision` history, `lockForUpdate()` on accept, `ExpireStaleOffers` command |
| 14 | chat needs-scoping | `ChatController` checks the thread belongs to the request |
| 15 | progress / deliverables / acceptance | `progress()`, `fulfill()`, `accept()` + `releasePayout()` with the agreed override |
| 18 | duplicate-as-draft / visibility | `duplicate()`, `visibility()` |
| 19 | provider workspace | `myListings()`, `myOffers()`, `myWork()` |
| 24 | bulk KYC verdict | `AdminNeedsController` resolves the latest verdict per user in one pass |

## Why the markers stay

They are the project's own convention: the number points at the spec
section a behaviour comes from, so a reviewer can check the requirement
against the code. The implementation sits right below the marker, and the
marker text describes what the code does ("revision rules (§8): the owner
may revise drafts and pending …").

Removing them would lose the spec traceability that the numbers exist to
provide; leaving them as-is is correct. What was *not* correct was the
belief that they marked unimplemented work — the audit above is the
evidence that they do not.

Re-run the audit with:

```
php docs/testing/scripts/spec-marker-audit.php
```

## Related

The genuinely open items are tracked in
`docs/product/PRIORITIZED_BACKLOG.md` and
`docs/implementation/MASTER_GAP_REGISTER.md` — not in these comments.
The money-depth items that used to sit behind those comments (milestone
escrow N-20, arbitration N-21, hourly billing N-25) shipped on
2026-10-21.
