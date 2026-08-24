<?php

namespace Core\Enums;

enum TicketStatus: string
{
    case OPEN = 'open';
    case IN_PROGRESS = 'in_progress';
    case PENDING = 'pending';
    case RESOLVED = 'resolved';
    case CLOSED = 'closed';
}
