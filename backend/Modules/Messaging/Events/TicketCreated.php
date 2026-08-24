<?php

namespace Modules\Messaging\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Modules\Messaging\Entities\Ticket;

class TicketCreated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Ticket $ticket
    ) {}
}
