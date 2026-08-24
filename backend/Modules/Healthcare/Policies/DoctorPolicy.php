<?php

namespace Modules\Healthcare\Policies;

use App\Models\User;
use Modules\Healthcare\Entities\Doctor;
use Illuminate\Auth\Access\HandlesAuthorization;

class DoctorPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Doctor $doctor): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->hasRole('super_admin') || $user->hasRole('healthcare_admin');
    }

    public function update(User $user, Doctor $doctor): bool
    {
        return $user->hasRole('super_admin')
            || $user->id === $doctor->user_id;
    }

    public function delete(User $user, Doctor $doctor): bool
    {
        return $user->hasRole('super_admin');
    }

    public function manageAvailability(User $user, Doctor $doctor): bool
    {
        return $user->hasRole('super_admin')
            || $user->id === $doctor->user_id;
    }
}
