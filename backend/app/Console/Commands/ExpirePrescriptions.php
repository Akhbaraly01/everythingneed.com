<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Modules\Pharmacy\Entities\Prescription;

/**
 * H-B - mark active prescriptions whose expires_at has passed as expired.
 * Without this the active/filled/expired lifecycle never advances on its own,
 * so an old prescription would keep unlocking prescription-only medicines.
 */
class ExpirePrescriptions extends Command
{
    protected $signature = 'pharmacy:expire-prescriptions';

    protected $description = 'Mark active prescriptions past their expires_at as expired';

    public function handle(): int
    {
        $expired = Prescription::where('status', Prescription::STATUS_ACTIVE)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->update(['status' => Prescription::STATUS_EXPIRED, 'updated_at' => now()]);

        $this->info("Expired {$expired} prescription(s).");

        return self::SUCCESS;
    }
}
