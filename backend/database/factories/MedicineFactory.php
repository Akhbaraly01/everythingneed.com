<?php

namespace Database\Factories;

use Modules\Pharmacy\Entities\Medicine;
use Illuminate\Database\Eloquent\Factories\Factory;

class MedicineFactory extends Factory
{
    protected $model = Medicine::class;

    public function definition(): array
    {
        return [
            'name' => fake()->words(3, true),
            'description' => fake()->paragraph(),
            'price' => fake()->randomFloat(2, 5, 100),
            'stock' => fake()->numberBetween(0, 200),
            'category' => fake()->randomElement(['painkillers', 'antibiotics', 'vitamins', 'prescription']),
            'dosage_form' => fake()->randomElement(['tablet', 'capsule', 'syrup', 'injection']),
            'strength' => fake()->randomElement(['500mg', '250mg', '100mg', '10ml']),
            'manufacturer' => fake()->company(),
            'is_active' => true,
        ];
    }
}
