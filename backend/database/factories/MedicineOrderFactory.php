<?php

namespace Database\Factories;

use Modules\Orders\Entities\MedicineOrder;
use Modules\Orders\Entities\MedicineOrderItem;
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
            'status' => 'pending',
            'total' => fake()->randomFloat(2, 10, 500),
            'subtotal' => fake()->randomFloat(2, 10, 500),
            'tax' => fake()->randomFloat(2, 0, 50),
            'shipping_cost' => fake()->randomFloat(2, 0, 20),
            'shipping_address' => fake()->address(),
            'payment_method' => 'card',
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
