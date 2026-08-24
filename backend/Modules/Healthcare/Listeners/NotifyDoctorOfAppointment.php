<?php

namespace Modules\Healthcare\Listeners;

use Modules\Healthcare\Events\AppointmentBooked;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class NotifyDoctorOfAppointment implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(AppointmentBooked $event): void
    {
        // Send notification to available doctor
        // Update doctor schedule
    }
}
