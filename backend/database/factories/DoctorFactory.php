<?php

namespace Database\Factories;

use Modules\Healthcare\Entities\Doctor;
use Illuminate\Database\Eloquent\Factories\Factory;

class DoctorFactory extends Factory
{
    protected $model = Doctor::class;

    public function definition(): array
    {
        return [
            'full_name' => 'Dr. ' . fake()->name(),
            'specialization' => fake()->randomElement(['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Dermatology']),
            'qualification' => fake()->randomElement(['MD', 'MBBS', 'DM', 'MS', 'DNB']),
            'experience_years' => fake()->numberBetween(1, 30),
            'consultation_fee' => fake()->randomFloat(2, 50, 300),
            'virtual_fee' => fake()->randomFloat(2, 30, 200),
            // W1: faker imageUrl() emits URLs on a dead external image
            // service - local placeholder until a real avatar is attached.
            'avatar_url' => '/placeholder.svg',
            'is_available' => true,
            'rating' => fake()->randomFloat(1, 1, 5),
        ];
    }

    public function unavailable(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_available' => false,
        ]);
    }
}
