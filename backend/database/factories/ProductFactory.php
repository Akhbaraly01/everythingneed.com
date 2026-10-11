<?php

namespace Database\Factories;

use Modules\Products\Entities\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        return [
            'name' => fake()->words(3, true),
            'description' => fake()->paragraph(),
            'price' => fake()->randomFloat(2, 9.99, 999.99),
            'compare_price' => null,
            // W1: faker imageUrl() emits URLs on a dead external image
            // service. Factory rows use the local placeholder until a real
            // image is attached (ProductImageSeeder backfills demo data).
            'image_url' => '/placeholder.svg',
            'stock_quantity' => fake()->numberBetween(0, 100),
            'category' => fake()->randomElement(['electronics', 'clothing', 'home', 'beauty']),
            'is_active' => true,
            // Factory items represent an established catalogue — approved by default.
            // The approval-queue lifecycle is covered explicitly in ProductApprovalTest.
            'approved_at' => now(),
        ];
    }
}
