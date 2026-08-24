<?php

namespace Modules\Learn\Policies;

use App\Models\User;
use Modules\Learn\Entities\Course;
use Illuminate\Auth\Access\HandlesAuthorization;

class CoursePolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Course $course): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->hasRole('super_admin') || $user->hasRole('instructor');
    }

    public function update(User $user, Course $course): bool
    {
        return $user->hasRole('super_admin')
            || $course->instructor_name === $user->name;
    }

    public function delete(User $user, Course $course): bool
    {
        return $user->hasRole('super_admin')
            || $course->instructor_name === $user->name;
    }

    public function manageEnrollments(User $user, Course $course): bool
    {
        return $user->hasRole('super_admin')
            || $course->instructor_name === $user->name;
    }
}
