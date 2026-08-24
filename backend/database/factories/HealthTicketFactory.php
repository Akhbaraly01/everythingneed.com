<?php

namespace Database\Factories;

use Modules\Healthcare\Entities\HealthTicket;
use Modules\Healthcare\Entities\Doctor;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class HealthTicketFactory extends Factory
{
    protected $model = HealthTicket::class;

    public function definition(): array
    {
        return [
            'patient_id' => User::factory(),
            'ticket_number' => fake()->unique()->bothify('HTK-#####'),
            'symptoms' => fake()->sentence(),
            'description' => fake()->paragraph(),
            'consultation_type' => 'in_person',
            'status' => 'pending',
            'priority' => 'normal',
        ];
    }

    public function withDoctor(): static
    {
        return $this->state(fn (array $attributes) => [
            'doctor_id' => Doctor::factory(),
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
        ]);
    }
}
