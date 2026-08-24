<?php

namespace Modules\Authentication\Actions;

use App\Models\User;
use Illuminate\Support\Facades\Auth;

class LogoutUser
{
    public function execute(): void
    {
        $user = Auth::user();

        if ($user) {
            $user->currentAccessToken()->delete();
        }
    }
}
