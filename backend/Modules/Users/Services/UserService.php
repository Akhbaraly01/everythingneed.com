<?php

namespace Modules\Users\Services;

use Modules\Users\Actions\UpdateProfile;
use Modules\Users\Actions\AddAddress;
use Modules\Users\Actions\DeleteAccount;
use App\Models\User;

class UserService
{
    public function __construct(
        private UpdateProfile $updateProfile,
        private AddAddress $addAddress,
        private DeleteAccount $deleteAccount,
    ) {}

    public function updateProfile(string $userId, array $data): object
    {
        return $this->updateProfile->execute($userId, $data);
    }

    public function addAddress(string $userId, array $data): object
    {
        return $this->addAddress->execute($userId, $data);
    }

    public function deleteAccount(string $userId, string $password): bool
    {
        return $this->deleteAccount->execute($userId, $password);
    }

    public function getUser(string $userId): ?User
    {
        return User::with(['profile', 'roles', 'wallet'])->find($userId);
    }

    public function getUsers(array $filters = [], int $page = 1, int $perPage = 15): object
    {
        $query = User::with(['profile', 'roles']);

        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('email', 'ilike', "%{$filters['search']}%")
                  ->orWhereHas('profile', function ($q2) use ($filters) {
                      $q2->where('full_name', 'ilike', "%{$filters['search']}%");
                  });
            });
        }

        if (!empty($filters['role'])) {
            $query->whereHas('roles', function ($q) use ($filters) {
                $q->where('role', $filters['role']);
            });
        }

        return $query->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);
    }
}
