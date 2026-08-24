<?php

namespace Modules\Messaging\Listeners;

use Modules\Messaging\Events\TicketCreated;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class NotifyDepartmentOfTicket implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(TicketCreated $event): void
    {
        // Send notification to department staff
        // Assign to available agent
    }
}
