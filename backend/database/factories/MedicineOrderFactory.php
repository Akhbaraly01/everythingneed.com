<?php

namespace Database\Factories;

use Modules\Orders\Entities\MedicineOrder;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class MedicineOrderFactory extends Factory
{
    protected $model = MedicineOrder::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'order_number' => fake()->unique()->bothify('ORD-#####'),
            'delivery_address' => fake()->address(),
            'prescription_url' => null,
            'total_amount' => fake()->randomFloat(2, 10, 500),
            'status' => 'pending',
        ];
    }

    public function confirmed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'confirmed',
        ]);
    }

    public function shipped(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'shipped',
        ]);
    }

    public function delivered(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'delivered',
        ]);
    }
}
