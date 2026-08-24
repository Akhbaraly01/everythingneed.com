<?php

namespace Modules\Notifications\Policies;

use App\Models\User;
use Modules\Notifications\Entities\Notification;
use Illuminate\Auth\Access\HandlesAuthorization;

class NotificationPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasRole('super_admin');
    }

    public function view(User $user, Notification $notification): bool
    {
        return $user->id === $notification->user_id
            || $user->hasRole('super_admin');
    }

    public function create(User $user): bool
    {
        return $user->hasRole('super_admin');
    }

    public function update(User $user, Notification $notification): bool
    {
        return $user->id === $notification->user_id
            || $user->hasRole('super_admin');
    }

    public function delete(User $user, Notification $notification): bool
    {
        return $user->id === $notification->user_id
            || $user->hasRole('super_admin');
    }

    public function sendBulk(User $user): bool
    {
        return $user->hasRole('super_admin');
    }

    public function markAsRead(User $user, Notification $notification): bool
    {
        return $user->id === $notification->user_id
            || $user->hasRole('super_admin');
    }
}
