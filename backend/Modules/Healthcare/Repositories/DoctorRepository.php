<?php
namespace Modules\Healthcare\Repositories;

use Core\Repositories\Repository;

interface DoctorRepository extends Repository
{
    public function findByUserId(string $userId): ?object;
    public function findAvailableDoctors(array $params = []): object;
    public function findBySpecialization(string $specialization, array $params = []): object;
    public function updateAvailability(string $id, bool $isAvailable): object;
}
