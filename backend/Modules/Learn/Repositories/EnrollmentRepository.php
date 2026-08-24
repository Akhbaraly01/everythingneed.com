<?php
namespace Modules\Learn\Repositories;

use Core\Repositories\Repository;

interface EnrollmentRepository extends Repository
{
    public function findByUserId(string $userId, array $params = []): object;
    public function findByCourseId(string $courseId, array $params = []): object;
    public function findUserCourseEnrollment(string $userId, string $courseId): ?object;
    public function updateProgress(string $id, int $progress): object;
    public function markCompleted(string $id): object;
}
