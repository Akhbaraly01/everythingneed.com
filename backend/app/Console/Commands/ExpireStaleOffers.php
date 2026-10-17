<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Modules\Needs\Entities\NeedOffer;

/**
 * TODO 12 — close quotations past their expiry so stale prices can never be
 * accepted. Lazy enforcement in acceptOffer covers races; this sweep keeps
 * queues and counts honest. Expired rows stay as history (never deleted).
 */
class ExpireStaleOffers extends Command
{
    protected $signature = 'needs:expire-offers';

    protected $description = 'Mark pending offers past their expiry as expired';

    public function handle(): int
    {
        $expired = NeedOffer::where('status', NeedOffer::STATUS_PENDING)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->update(['status' => NeedOffer::STATUS_EXPIRED, 'updated_at' => now()]);

        $this->info("Expired {$expired} offer(s).");

        return self::SUCCESS;
    }
}
