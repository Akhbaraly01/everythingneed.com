<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Products\Entities\Brand;

class BrandSeeder extends Seeder
{
    public function run(): void
    {
        $brands = [
            ['name' => 'Samsung', 'slug' => 'samsung'],
            ['name' => 'Apple', 'slug' => 'apple'],
            ['name' => 'Nike', 'slug' => 'nike'],
            ['name' => 'Adidas', 'slug' => 'adidas'],
            ['name' => 'Sony', 'slug' => 'sony'],
            ['name' => 'Dell', 'slug' => 'dell'],
            ['name' => 'HP', 'slug' => 'hp'],
            ['name' => 'Lenovo', 'slug' => 'lenovo'],
            ['name' => 'Puma', 'slug' => 'puma'],
            ['name' => 'Under Armour', 'slug' => 'under-armour'],
        ];

        foreach ($brands as $brand) {
            Brand::updateOrCreate(['slug' => $brand['slug']], $brand);
        }
    }
}
