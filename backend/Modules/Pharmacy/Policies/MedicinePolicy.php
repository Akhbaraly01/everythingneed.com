<?php

namespace Modules\Pharmacy\Policies;

use App\Models\User;
use Modules\Pharmacy\Entities\Medicine;
use Illuminate\Auth\Access\HandlesAuthorization;

class MedicinePolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Medicine $medicine): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->hasRole('super_admin') || $user->hasRole('pharmacy_admin');
    }

    public function update(User $user, Medicine $medicine): bool
    {
        return $user->hasRole('super_admin') || $user->hasRole('pharmacy_admin');
    }

    public function delete(User $user, Medicine $medicine): bool
    {
        return $user->hasRole('super_admin');
    }

    public function manageStock(User $user, Medicine $medicine): bool
    {
        return $user->hasRole('super_admin') || $user->hasRole('pharmacy_admin');
    }
}
