<?php

namespace Modules\Healthcare\Listeners;

use Modules\Healthcare\Events\DoctorAssigned;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class NotifyPatientOfDoctorAssignment implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(DoctorAssigned $event): void
    {
        // Send notification to patient about doctor assignment
        // Send appointment details
    }
}
