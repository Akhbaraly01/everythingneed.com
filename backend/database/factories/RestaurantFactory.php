<?php

namespace Database\Factories;

use Modules\Food\Entities\Restaurant;
use Illuminate\Database\Eloquent\Factories\Factory;

class RestaurantFactory extends Factory
{
    protected $model = Restaurant::class;

    public function definition(): array
    {
        return [
            'name' => fake()->company() . ' Restaurant',
            'description' => fake()->paragraph(),
            'cuisine_type' => fake()->randomElement(['italian', 'chinese', 'indian', 'mexican', 'japanese']),
            'address' => fake()->address(),
            'city' => fake()->city(),
            'phone' => fake()->phoneNumber(),
            'rating' => fake()->randomFloat(1, 1, 5),
            'is_active' => true,
        ];
    }
}
