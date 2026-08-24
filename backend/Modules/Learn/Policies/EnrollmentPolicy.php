<?php

namespace Modules\Learn\Policies;

use App\Models\User;
use Modules\Learn\Entities\Enrollment;
use Illuminate\Auth\Access\HandlesAuthorization;

class EnrollmentPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasRole('super_admin');
    }

    public function view(User $user, Enrollment $enrollment): bool
    {
        return $user->id === $enrollment->user_id
            || $user->hasRole('super_admin');
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Enrollment $enrollment): bool
    {
        return $user->id === $enrollment->user_id
            || $user->hasRole('super_admin');
    }

    public function delete(User $user, Enrollment $enrollment): bool
    {
        return $user->id === $enrollment->user_id
            || $user->hasRole('super_admin');
    }

    public function complete(User $user, Enrollment $enrollment): bool
    {
        return $user->id === $enrollment->user_id
            || $user->hasRole('super_admin');
    }
}
