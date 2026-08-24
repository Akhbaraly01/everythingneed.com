<?php
namespace Modules\Food\Repositories;

use Core\Repositories\Repository;

interface RestaurantRepository extends Repository
{
    public function findByUserId(string $userId): ?object;
    public function findByCuisineType(string $cuisineType, array $params = []): object;
    public function findActiveRestaurants(array $params = []): object;
    public function updateRating(string $id, float $rating): object;
}
