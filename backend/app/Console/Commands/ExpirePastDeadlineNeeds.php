<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Modules\Needs\Entities\NeedRequest;

/**
 * Spec §111 — expire open needs whose deadline has passed. Only `published`
 * needs are transitioned (in-flight statuses keep their offers); the audit
 * trail records the sweep.
 */
class ExpirePastDeadlineNeeds extends Command
{
    protected $signature = 'needs:expire-past-deadline';

    protected $description = 'Mark published needs past their deadline as expired';

    public function handle(): int
    {
        $expired = NeedRequest::where('status', NeedRequest::STATUS_PUBLISHED)
            ->whereNotNull('deadline')
            ->whereDate('deadline', '<', today()->toDateString())
            ->update(['status' => NeedRequest::STATUS_EXPIRED, 'updated_at' => now()]);

        $this->info("Expired {$expired} need(s).");

        return self::SUCCESS;
    }
}
