<?php

namespace Core\Enums;

enum WalletTransactionType: string
{
    case CREDIT = 'credit';
    case DEBIT = 'debit';
}
