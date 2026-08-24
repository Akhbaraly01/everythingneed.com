<?php
namespace Modules\Hotels\Repositories;

use Core\Repositories\Repository;

interface HotelRepository extends Repository
{
    public function findByCity(string $city, array $params = []): object;
    public function findActiveHotels(array $params = []): object;
    public function findByStarRating(int $starRating, array $params = []): object;
    public function updateRating(string $id, float $rating): object;
}
