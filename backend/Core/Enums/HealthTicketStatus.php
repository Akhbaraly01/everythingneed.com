<?php

namespace Core\Enums;

enum HealthTicketStatus: string
{
    case PENDING = 'pending';
    case ASSIGNED = 'assigned';
    case IN_CONSULTATION = 'in_consultation';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';
}
