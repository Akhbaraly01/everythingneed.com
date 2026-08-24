<?php

namespace Modules\Healthcare\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Modules\Healthcare\Entities\HealthTicket;

class DoctorAssigned
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public HealthTicket $ticket
    ) {}
}
