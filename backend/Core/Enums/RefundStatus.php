<?php

namespace Core\Enums;

enum RefundStatus: string
{
    case PENDING = 'pending';
    case APPROVED = 'approved';
    case REJECTED = 'rejected';
    case COMPLETED = 'completed';
}
