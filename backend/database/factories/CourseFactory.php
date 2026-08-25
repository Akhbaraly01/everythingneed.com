<?php

namespace Database\Factories;

use Modules\Learn\Entities\Course;
use Illuminate\Database\Eloquent\Factories\Factory;

class CourseFactory extends Factory
{
    protected $model = Course::class;

    /**
     * Schema-aligned with the live `courses` table:
     * id title slug description category course_type instructor_name price
     * thumbnail_url video_url duration_hours students_count rating
     * is_featured created_at updated_at deleted_at
     */
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(4),
            'slug' => fake()->unique()->slug(),
            'description' => fake()->paragraph(),
            'category' => fake()->randomElement(['programming', 'design', 'business', 'agriculture', 'healthcare']),
            'course_type' => fake()->randomElement(['theory', 'practical', 'both']),
            'instructor_name' => fake()->name(),
            'price' => fake()->randomFloat(2, 0, 199.99),
            'duration_hours' => fake()->numberBetween(1, 40),
            'students_count' => 0,
            'rating' => 0,
            'is_featured' => false,
        ];
    }
}
