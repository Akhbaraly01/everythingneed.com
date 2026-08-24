<?php

namespace Modules\Orders\Policies;

use App\Models\User;
use Modules\Orders\Entities\MedicineOrder;
use Illuminate\Auth\Access\HandlesAuthorization;

class OrderPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasRole('super_admin') || $user->hasRole('customer_service');
    }

    public function view(User $user, MedicineOrder $order): bool
    {
        return $user->id === $order->user_id
            || $user->hasRole('super_admin')
            || $user->hasRole('customer_service');
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function cancel(User $user, MedicineOrder $order): bool
    {
        return $user->id === $order->user_id
            && in_array($order->status, ['pending', 'confirmed']);
    }
}
