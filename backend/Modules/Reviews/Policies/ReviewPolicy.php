<?php

namespace Modules\Reviews\Policies;

use App\Models\User;
use Modules\Reviews\Entities\Review;
use Illuminate\Auth\Access\HandlesAuthorization;

class ReviewPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Review $review): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Review $review): bool
    {
        return $user->id === $review->user_id
            || $user->hasRole('super_admin');
    }

    public function delete(User $user, Review $review): bool
    {
        return $user->id === $review->user_id
            || $user->hasRole('super_admin');
    }

    public function moderate(User $user, Review $review): bool
    {
        return $user->hasRole('super_admin') || $user->hasRole('category_admin');
    }
}
