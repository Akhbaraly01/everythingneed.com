<?php

namespace Database\Factories;

use Modules\Learn\Entities\Course;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class CourseFactory extends Factory
{
    protected $model = Course::class;

    public function definition(): array
    {
        return [
            'creator_id' => User::factory(),
            'title' => fake()->sentence(4),
            'slug' => fake()->unique()->slug(),
            'description' => fake()->paragraph(),
            'category' => fake()->randomElement(['programming', 'design', 'business', 'marketing']),
            'level' => fake()->randomElement(['beginner', 'intermediate', 'advanced']),
            'type' => fake()->randomElement(['free', 'paid']),
            'price' => fake()->randomFloat(2, 0, 199.99),
            'is_published' => false,
        ];
    }

    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_published' => true,
        ]);
    }

    public function free(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'free',
            'price' => 0,
        ]);
    }
}
