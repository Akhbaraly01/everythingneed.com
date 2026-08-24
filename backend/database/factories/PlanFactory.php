<?php

namespace Database\Factories;

use Modules\Subscriptions\Entities\Plan;
use Illuminate\Database\Eloquent\Factories\Factory;

class PlanFactory extends Factory
{
    protected $model = Plan::class;

    public function definition(): array
    {
        return [
            'name' => fake()->randomElement(['Basic', 'Pro', 'Enterprise']),
            'slug' => fake()->unique()->slug(),
            'description' => fake()->paragraph(),
            'price' => fake()->randomFloat(2, 9.99, 99.99),
            'duration_days' => fake()->randomElement([30, 90, 365]),
            'features' => json_encode(['feature1', 'feature2']),
            'is_active' => true,
        ];
    }
}
