<?php

namespace Modules\Users\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class UserPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasRole('super_admin') || $user->hasRole('customer_service');
    }

    public function view(User $user, User $model): bool
    {
        return $user->id === $model->id
            || $user->hasRole('super_admin')
            || $user->hasRole('customer_service');
    }

    public function create(User $user): bool
    {
        return $user->hasRole('super_admin');
    }

    public function update(User $user, User $model): bool
    {
        return $user->id === $model->id
            || $user->hasRole('super_admin');
    }

    public function delete(User $user, User $model): bool
    {
        return $user->hasRole('super_admin');
    }

    public function manageRoles(User $user): bool
    {
        return $user->hasRole('super_admin');
    }

    public function suspend(User $user, User $model): bool
    {
        return $user->hasRole('super_admin');
    }
}
