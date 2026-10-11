<?php

namespace Database\Factories;

use Modules\Payments\Entities\Payment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PaymentFactory extends Factory
{
    protected $model = Payment::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'order_id' => null,
            'amount' => fake()->randomFloat(2, 10, 500),
            'currency' => 'USD',
            'method' => 'card',
            'status' => 'succeeded',
            'reference' => 'PAY-'.fake()->unique()->numerify('########'),
            'provider' => 'mock',
        ];
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
        ]);
    }

    public function failed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'failed',
        ]);
    }

    public function processing(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'processing',
        ]);
    }
}
