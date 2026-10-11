<?php

namespace Modules\Authentication\Actions;

use Modules\Authentication\Entities\TwoFactorSecret;

class DisableTwoFactor
{
    /**
     * Idempotent: disabling when nothing is configured is a no-op success.
     */
    public function execute(string $userId): bool
    {
        TwoFactorSecret::where('user_id', $userId)->update(['enabled' => false]);

        return true;
    }
}
