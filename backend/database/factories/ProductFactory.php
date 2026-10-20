<?php

namespace Database\Factories;

use Modules\Products\Entities\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductFactory extends Factory
{
    protected $model = Product::class;

    /**
     * Realistic demo catalogue per category (design v3). Names drive the
     * type-aware seed artwork (PlaceholderArt::productGlyph), so a shirt
     * renders a shirt and a laptop renders a laptop — never a generic box.
     */
    public const CATALOG = [
        'electronics' => [
            'Wireless Bluetooth Headphones', 'Smartphone 128GB', 'Ultrabook Laptop 14-inch',
            'Smart Fitness Watch', '4K Action Camera', 'Portable Bluetooth Speaker',
            'Mechanical Gaming Keyboard', 'Wireless Mouse', '55-inch Smart TV',
            'Tablet 10-inch WiFi', 'Fast Charger USB-C 65W', 'Power Bank 20000mAh',
            'Noise-Cancelling Earbuds', 'HD Webcam 1080p', 'External SSD 1TB',
            'Smart LED Bulb Set', 'Drone with 4K Camera', 'Soundbar 2.1 Channel',
            'Gaming Console Controller', 'Wi-Fi Router Dual Band',
        ],
        'clothing' => [
            'Classic Cotton T-Shirt', 'Slim-Fit Denim Jeans', 'Running Sneakers',
            'Summer Floral Dress', 'Wool Blend Overcoat', 'Leather Ankle Boots',
            'Casual Fleece Hoodie', 'Chino Trousers', 'Striped Polo Shirt',
            'Linen Summer Shorts', 'Denim Jacket', 'Pleated Midi Skirt',
            'Canvas Slip-On Shoes', 'Knit Cardigan Sweater', 'Cotton Baseball Cap',
        ],
        'home' => [
            'Ceramic Cookware Set', 'Stainless Steel Kettle', 'Cotton Bed Sheet Set',
            'Modern Table Lamp', 'Non-Stick Frying Pan', 'Storage Cabinet Shelf',
            'Memory Foam Mattress Pad', 'Glass Mug Set of 4', 'Waterproof Tablecloth',
            'Bamboo Cutting Board',
        ],
        'beauty' => [
            'Moisturising Body Lotion', 'Herbal Shampoo', 'Vitamin C Serum',
            'Natural Bar Soap', 'Sunscreen SPF 50', 'Rose Body Oil',
            'Lip Balm Trio', 'Facial Cleanser Gel', 'Hand Cream Duo', 'Hair Conditioner',
        ],
    ];

    /**
     * @return list<string>
     */
    public static function catalogNames(string $category): array
    {
        return self::CATALOG[$category] ?? [];
    }

    public function definition(): array
    {
        $category = fake()->randomElement(array_keys(self::CATALOG));
        $names = self::CATALOG[$category];

        return [
            'name' => fake()->randomElement($names),
            'description' => fake()->sentence(10),
            'price' => fake()->randomFloat(2, 9.99, 999.99),
            'compare_price' => null,
            // W1: faker imageUrl() emits URLs on a dead external image
            // service. Factory rows use the local placeholder until a real
            // image is attached (ProductImageSeeder backfills demo data).
            'image_url' => '/placeholder.svg',
            'stock_quantity' => fake()->numberBetween(0, 100),
            'category' => $category,
            'is_active' => true,
            // Factory items represent an established catalogue — approved by default.
            // The approval-queue lifecycle is covered explicitly in ProductApprovalTest.
            'approved_at' => now(),
        ];
    }
}
