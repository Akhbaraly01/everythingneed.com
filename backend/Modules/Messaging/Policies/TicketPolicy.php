<?php

namespace Modules\Messaging\Policies;

use App\Models\User;
use Modules\Messaging\Entities\Ticket;
use Illuminate\Auth\Access\HandlesAuthorization;

class TicketPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasRole('super_admin') || $user->hasRole('customer_service');
    }

    public function view(User $user, Ticket $ticket): bool
    {
        return $user->id === $ticket->user_id
            || $user->id === $ticket->assigned_to
            || $user->hasRole('super_admin')
            || $user->hasRole('customer_service');
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Ticket $ticket): bool
    {
        return $user->id === $ticket->assigned_to
            || $user->hasRole('super_admin')
            || $user->hasRole('customer_service');
    }

    public function delete(User $user, Ticket $ticket): bool
    {
        return $user->hasRole('super_admin');
    }

    public function assign(User $user, Ticket $ticket): bool
    {
        return $user->hasRole('super_admin')
            || $user->hasRole('customer_service');
    }

    public function close(User $user, Ticket $ticket): bool
    {
        return $user->id === $ticket->user_id
            || $user->id === $ticket->assigned_to
            || $user->hasRole('super_admin')
            || $user->hasRole('customer_service');
    }
}
