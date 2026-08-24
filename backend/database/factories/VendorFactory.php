<?php

namespace Database\Factories;

use Modules\Vendors\Entities\Vendor;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class VendorFactory extends Factory
{
    protected $model = Vendor::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'store_name' => fake()->company(),
            'category' => fake()->randomElement(['electronics', 'clothing', 'home', 'beauty']),
            'description' => fake()->paragraph(),
            'is_verified' => false,
            'rating' => 0,
        ];
    }

    public function verified(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_verified' => true,
        ]);
    }
}
