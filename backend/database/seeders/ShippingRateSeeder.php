<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Checkout\Entities\ShippingRate;

class ShippingRateSeeder extends Seeder
{
    public function run(): void
    {
        ShippingRate::updateOrCreate(
            ['name' => 'Standard'],
            [
                'rate' => 4.99,
                'free_shipping_min_subtotal' => 50.00,
                'is_active' => true,
                'sort' => 0,
            ]
        );

        ShippingRate::updateOrCreate(
            ['name' => 'Express'],
            [
                'rate' => 12.99,
                'free_shipping_min_subtotal' => null,
                'is_active' => true,
                'sort' => 1,
            ]
        );
    }
}
