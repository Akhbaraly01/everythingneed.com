<?php
namespace Modules\Rides\Repositories;

use Core\Repositories\Repository;

interface RideRepository extends Repository
{
    public function findByUserId(string $userId, array $params = []): object;
    public function findByDriverId(string $driverId, array $params = []): object;
    public function findByStatus(string $status, array $params = []): object;
    public function updateStatus(string $id, string $status): object;
}
