<?php

namespace Modules\Users\Actions;

use App\Models\User;
use Core\Exceptions\NotFoundException;
use Core\Exceptions\ValidationException;

class AssignRole
{
    private array $validRoles = ['user', 'vendor', 'doctor', 'admin', 'super_admin'];

    public function execute(string $userId, string $role): object
    {
        $user = User::find($userId);

        if (!$user) {
            throw new NotFoundException('User', $userId);
        }

        if (!in_array($role, $this->validRoles)) {
            throw new ValidationException("Invalid role: {$role}");
        }

        $user->update(['role' => $role]);

        return $user->fresh();
    }
}
