<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Modules\Inventory\Entities\InventoryReservation;

class ReleaseExpiredReservations extends Command
{
    protected $signature = 'inventory:release-expired';

    protected $description = 'Release cart inventory reservations whose hold window has expired';

    public function handle(): int
    {
        // withTrashed also purges any soft-deleted leftovers.
        $released = InventoryReservation::withTrashed()
            ->where('expires_at', '<=', now())
            ->forceDelete();

        $this->info("Released {$released} expired reservation(s).");

        return self::SUCCESS;
    }
}
