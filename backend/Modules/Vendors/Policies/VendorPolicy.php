<?php

namespace Modules\Vendors\Policies;

use App\Models\User;
use Modules\Vendors\Entities\Vendor;
use Illuminate\Auth\Access\HandlesAuthorization;

class VendorPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Vendor $vendor): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return !$user->vendor;
    }

    public function update(User $user, Vendor $vendor): bool
    {
        return $user->id === $vendor->user_id;
    }

    public function approve(User $user, Vendor $vendor): bool
    {
        return $user->hasRole('super_admin');
    }

    public function suspend(User $user, Vendor $vendor): bool
    {
        return $user->hasRole('super_admin');
    }
}
