<?php

namespace Core\Enums;

enum HotelReservationStatus: string
{
    case PENDING = 'pending';
    case CONFIRMED = 'confirmed';
    case CANCELLED = 'cancelled';
    case COMPLETED = 'completed';
}
