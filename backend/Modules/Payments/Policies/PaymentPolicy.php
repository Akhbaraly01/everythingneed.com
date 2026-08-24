<?php

namespace Modules\Payments\Policies;

use App\Models\User;
use Modules\Payments\Entities\Payment;
use Illuminate\Auth\Access\HandlesAuthorization;

class PaymentPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasRole('super_admin');
    }

    public function view(User $user, Payment $payment): bool
    {
        return $user->id === $payment->user_id
            || $user->hasRole('super_admin');
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function refund(User $user, Payment $payment): bool
    {
        return $user->hasRole('super_admin')
            || $user->hasRole('customer_service');
    }
}
