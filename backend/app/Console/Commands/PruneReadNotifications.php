<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Modules\Notifications\Entities\Notification;

/**
 * Spec §111 — notification cleanup. Read notifications older than the
 * retention window are hard-deleted; unread rows are never touched no
 * matter their age.
 */
class PruneReadNotifications extends Command
{
    protected $signature = 'notifications:prune-read {--days=90 : Delete read notifications older than this many days}';

    protected $description = 'Delete read notifications beyond the retention window';

    public function handle(): int
    {
        $days = max(1, (int) $this->option('days'));
        $cutoff = now()->subDays($days);

        $deleted = Notification::where('is_read', true)
            ->where('created_at', '<', $cutoff)
            ->forceDelete();

        $this->info("Pruned {$deleted} read notification(s) older than {$days} day(s).");

        return self::SUCCESS;
    }
}
