<?php

namespace Database\Factories;

use Modules\RealEstate\Entities\Property;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PropertyFactory extends Factory
{
    protected $model = Property::class;

    public function definition(): array
    {
        return [
            'owner_id' => User::factory(),
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'type' => fake()->randomElement(['sale', 'rent']),
            'property_type' => fake()->randomElement(['apartment', 'house', 'land', 'commercial']),
            'price' => fake()->randomFloat(2, 50000, 1000000),
            'address' => fake()->address(),
            'city' => fake()->city(),
            'state' => fake()->state(),
            'country' => fake()->country(),
            'bedrooms' => fake()->numberBetween(1, 6),
            'bathrooms' => fake()->numberBetween(1, 4),
            'area' => fake()->randomFloat(2, 50, 500),
            'is_active' => true,
        ];
    }
}
