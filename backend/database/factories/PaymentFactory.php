<?php

namespace Database\Factories;

use Modules\Payments\Entities\Payment;
use Modules\Orders\Entities\MedicineOrder;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PaymentFactory extends Factory
{
    protected $model = Payment::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'order_id' => MedicineOrder::factory(),
            'amount' => fake()->randomFloat(2, 10, 500),
            'currency' => 'USD',
            'method' => 'card',
            'status' => 'completed',
            'transaction_id' => fake()->unique()->bothify('txn_############'),
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
}
