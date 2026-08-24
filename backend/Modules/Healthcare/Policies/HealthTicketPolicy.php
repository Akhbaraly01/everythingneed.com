<?php

namespace Modules\Healthcare\Policies;

use App\Models\User;
use Modules\Healthcare\Entities\HealthTicket;
use Illuminate\Auth\Access\HandlesAuthorization;

class HealthTicketPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasRole('super_admin') || $user->hasRole('customer_service');
    }

    public function view(User $user, HealthTicket $ticket): bool
    {
        return $user->id === $ticket->patient_id
            || $user->id === $ticket->doctor?->user_id
            || $user->hasRole('super_admin')
            || $user->hasRole('customer_service');
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, HealthTicket $ticket): bool
    {
        return $user->id === $ticket->patient_id
            || $user->id === $ticket->doctor?->user_id
            || $user->hasRole('super_admin')
            || $user->hasRole('customer_service');
    }

    public function delete(User $user, HealthTicket $ticket): bool
    {
        return $user->hasRole('super_admin');
    }
}
