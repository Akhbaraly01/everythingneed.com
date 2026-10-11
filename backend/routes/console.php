<?php

use Illuminate\Support\Facades\Schedule;

// App\Console\Kernel is not bound under Laravel 13 ApplicationBuilder;
// schedule must live here or it never runs.
Schedule::command('financial:reconcile --release-expired')->hourly();
Schedule::command('inventory:release-expired')->everyFiveMinutes();

// Wave R (spec §111) — recurring maintenance.
Schedule::command('cms:prune-revisions')->daily();
Schedule::command('needs:expire-past-deadline')->daily();
Schedule::command('notifications:prune-read')->weekly();

// H-B — an active prescription past its expires_at stops unlocking
// prescription-only medicines.
Schedule::command('pharmacy:expire-prescriptions')->daily();
