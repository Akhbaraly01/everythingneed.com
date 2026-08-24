<?php

namespace Core\Enums;

enum BookingStatus: string
{
    case PENDING = 'pending';
    case CONFIRMED = 'confirmed';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';
}
