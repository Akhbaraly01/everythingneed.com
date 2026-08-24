<?php
namespace Modules\Users\Repositories;

use Core\Repositories\Repository;

interface UserRepository extends Repository
{
    public function findByEmail(string $email): ?object;
    public function findAddressesByUserId(string $userId): object;
    public function findCertificatesByUserId(string $userId): object;
    public function updateProfile(string $id, array $data): object;
}
