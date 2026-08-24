<?php

namespace Core\Enums;

enum SubscriptionStatus: string
{
    case ACTIVE = 'active';
    case CANCELLED = 'cancelled';
    case EXPIRED = 'expired';
    case PAUSED = 'paused';
}
