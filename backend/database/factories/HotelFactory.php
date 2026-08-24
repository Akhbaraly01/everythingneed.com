<?php

namespace Database\Factories;

use Modules\Hotels\Entities\Hotel;
use Illuminate\Database\Eloquent\Factories\Factory;

class HotelFactory extends Factory
{
    protected $model = Hotel::class;

    public function definition(): array
    {
        return [
            'name' => fake()->company() . ' Hotel',
            'description' => fake()->paragraph(),
            'address' => fake()->address(),
            'city' => fake()->city(),
            'country' => fake()->country(),
            'phone' => fake()->phoneNumber(),
            'star_rating' => fake()->numberBetween(1, 5),
            'is_active' => true,
        ];
    }
}
