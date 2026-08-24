<?php
namespace Modules\Healthcare\Repositories;

use Core\Repositories\Repository;

interface HealthTicketRepository extends Repository
{
    public function findByPatientId(string $patientId, array $params = []): object;
    public function findByDoctorId(string $doctorId, array $params = []): object;
    public function findByTicketNumber(string $ticketNumber): ?object;
    public function findByStatus(string $status, array $params = []): object;
    public function updateStatus(string $id, string $status): object;
}
