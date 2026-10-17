<?php

use Illuminate\Support\Facades\Schedule;

// App\Console\Kernel is not bound under Laravel 13 ApplicationBuilder;
// schedule must live here or it never runs.
Schedule::command('financial:reconcile --release-expired')->hourly();
Schedule::command('inventory:release-expired')->everyFiveMinutes();

// Wave R (spec §111) — recurring maintenance.
Schedule::command('cms:prune-revisions')->daily();
Schedule::command('needs:expire-past-deadline')->daily();
Schedule::command('needs:expire-offers')->daily();
Schedule::command('notifications:prune-read')->weekly();

// N-31 saved-search alerts: match new public requests against saved
// searches and notify (hourly; the cursor only advances on a match).
Schedule::command('needs:alert-saved-searches')->hourly();

// H-B — an active prescription past its expires_at stops unlocking
// prescription-only medicines.
Schedule::command('pharmacy:expire-prescriptions')->daily();

// Phase 4 — tamper-evidence: a broken audit chain pages the operator log.
Schedule::command('audit:verify-chain')->daily();

// Phase 5 — abuse-shape detection over the audit trail (alerts, not blocks).
Schedule::command('security:detect-anomalies')->daily();
