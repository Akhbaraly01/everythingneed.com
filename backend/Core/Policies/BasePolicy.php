<?php

namespace Core\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

abstract class BasePolicy
{
    use HandlesAuthorization;

    protected ?string $modelClass = null;

    public function viewAny(User $user): bool
    {
        return $this->hasRole($user, ['super_admin', 'category_admin']);
    }

    public function view(User $user, $model): bool
    {
        return $this->hasRole($user, ['super_admin', 'category_admin']);
    }

    public function create(User $user): bool
    {
        return $this->hasRole($user, ['super_admin', 'category_admin']);
    }

    public function update(User $user, $model): bool
    {
        return $this->hasRole($user, ['super_admin', 'category_admin']);
    }

    public function delete(User $user, $model): bool
    {
        return $this->hasRole($user, ['super_admin']);
    }

    protected function hasRole(User $user, array $roles): bool
    {
        return $user->roles()->whereIn('role', $roles)->exists();
    }

    protected function isOwner(User $user, $model, string $ownerField = 'user_id'): bool
    {
        return $model->{$ownerField} === $user->id;
    }
}
