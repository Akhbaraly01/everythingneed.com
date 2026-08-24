<?php
namespace Modules\Learn\Repositories;

use Core\Repositories\Repository;

interface CourseRepository extends Repository
{
    public function findBySlug(string $slug): ?object;
    public function findByCategory(string $category, array $params = []): object;
    public function findFeaturedCourses(array $params = []): object;
    public function updateStudentsCount(string $id, int $count): object;
}
