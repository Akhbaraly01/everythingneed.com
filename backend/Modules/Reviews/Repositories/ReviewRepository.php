<?php
namespace Modules\Reviews\Repositories;

use Core\Repositories\Repository;

interface ReviewRepository extends Repository
{
    public function findByUserId(string $userId, array $params = []): object;
    public function findByReviewable(string $type, string $id, array $params = []): object;
    public function findVerifiedPurchases(array $params = []): object;
    public function updateHelpfulCount(string $id, int $count): object;
}
