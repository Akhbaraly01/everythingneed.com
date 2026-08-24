<?php

namespace Database\Factories;

use Modules\Jobs\Entities\JobPost;
use Illuminate\Database\Eloquent\Factories\Factory;

class JobPostFactory extends Factory
{
    protected $model = JobPost::class;

    public function definition(): array
    {
        return [
            'title' => fake()->jobTitle(),
            'description' => fake()->paragraph(),
            'company_name' => fake()->company(),
            'location' => fake()->city(),
            'category' => fake()->randomElement(['tech', 'design', 'marketing', 'sales']),
            'type' => fake()->randomElement(['full_time', 'part_time', 'contract']),
            'salary_min' => fake()->numberBetween(30000, 60000),
            'salary_max' => fake()->numberBetween(60000, 120000),
            'is_active' => true,
        ];
    }
}
