<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Services\Entities\ServiceCategory;
use Modules\Services\Entities\ServiceDefinition;

/**
 * Mega-phase M-1: service taxonomy seed - real-world service categories +
 * subcategories with icons/colors for the 7-icons + See more grids, plus a
 * small set of demo services so every root category has live content.
 *
 * Idempotent: categories upsert by slug, demo services by exact name, and
 * legacy free-text rows are re-linked to the taxonomy on every run.
 */
class ServiceCategorySeeder extends Seeder
{
    /** slug => [name, icon, color, sort, subcategories [slug => name]] */
    private const TAXONOMY = [
        'home-cleaning' => ['Home Cleaning', 'sparkles', '#0EA5E9', 1, [
            'deep-cleaning' => 'Deep Cleaning',
            'housekeeping' => 'Regular Housekeeping',
            'office-cleaning' => 'Office Cleaning',
        ]],
        'repairs-maintenance' => ['Repairs & Maintenance', 'wrench', '#F59E0B', 2, [
            'appliance-repair' => 'Appliance Repair',
            'ac-repair' => 'AC & Fridge Servicing',
            'furniture-assembly' => 'Furniture Assembly',
        ]],
        'building' => ['Building & Construction', 'hammer', '#6366F1', 3, [
            'masonry-tiling' => 'Masonry & Tiling',
            'painting' => 'Painting & Finishing',
            'windows-doors' => 'Windows & Doors',
        ]],
        'electrical' => ['Electrical & Solar', 'zap', '#EAB308', 4, [
            'wiring' => 'Wiring & Rewiring',
            'solar-installation' => 'Solar Installation',
        ]],
        'plumbing' => ['Plumbing & Water', 'droplets', '#06B6D4', 5, [
            'leak-repair' => 'Leak Repair',
            'drainage' => 'Drainage & Sewage',
            'tank-pump' => 'Tanks & Pumps',
        ]],
        'beauty-wellness' => ['Beauty & Wellness', 'scissors', '#EC4899', 6, [
            'hair-styling' => 'Hair & Styling',
            'spa-massage' => 'Spa & Massage',
            'makeup' => 'Makeup & Events',
        ]],
        'events-catering' => ['Events & Catering', 'party', '#F97316', 7, [
            'catering' => 'Catering',
            'decoration' => 'Decoration & Styling',
            'photography' => 'Event Photography',
        ]],
        'transport' => ['Transport & Logistics', 'truck', '#14B8A6', 8, [
            'moving-packing' => 'Moving & Packing',
            'courier' => 'Courier & Delivery',
        ]],
        'professional' => ['Professional Services', 'briefcase', '#8B5CF6', 9, [
            'legal' => 'Legal Services',
            'accounting' => 'Accounting & Tax',
            'consulting' => 'Business Consulting',
        ]],
        'automobile' => ['Automobile Services', 'car', '#EF4444', 10, [
            'mechanic' => 'Mechanic & Diagnostics',
            'car-wash' => 'Car Wash & Detailing',
            'tyres-alignment' => 'Tyres & Alignment',
        ]],
    ];

    /** [name, category slug, child slug|null, price, unit] */
    private const DEMO_SERVICES = [
        ['Home Deep Cleaning', 'home-cleaning', 'deep-cleaning', 120, 'fixed'],
        ['AC Servicing & Repair', 'repairs-maintenance', 'ac-repair', 75, 'fixed'],
        ['Furniture Assembly Visit', 'repairs-maintenance', 'furniture-assembly', 45, 'fixed'],
        ['Solar Panel Installation', 'electrical', 'solar-installation', 800, 'quote'],
        ['Leak Repair Visit', 'plumbing', 'leak-repair', 60, 'fixed'],
        ['Hair Styling at Home', 'beauty-wellness', 'hair-styling', 40, 'fixed'],
        ['Event Catering Package', 'events-catering', 'catering', 350, 'quote'],
        ['Local Moving Service', 'transport', 'moving-packing', 220, 'fixed'],
    ];

    public function run(): void
    {
        $subcategoryIds = [];

        foreach (self::TAXONOMY as $slug => [$name, $icon, $color, $sort, $children]) {
            $root = ServiceCategory::updateOrCreate(
                ['slug' => $slug],
                [
                    'name' => $name,
                    'icon' => $icon,
                    'color' => $color,
                    'sort_order' => $sort,
                    'parent_id' => null,
                    'is_active' => true,
                ]
            );

            foreach ($children as $childSlug => $childName) {
                $child = ServiceCategory::updateOrCreate(
                    ['slug' => $childSlug],
                    [
                        'name' => $childName,
                        'icon' => $icon,
                        'color' => $color,
                        'sort_order' => $sort,
                        'parent_id' => $root->id,
                        'is_active' => true,
                    ]
                );
                $subcategoryIds[$childSlug] = $child->id;
            }

            $subcategoryIds[$slug] = $root->id;
        }

        // Re-link legacy free-text rows ("Building Services" etc.) so the
        // catalogue filter and the grids agree.
        foreach (ServiceCategory::all() as $category) {
            ServiceDefinition::whereNull('category_id')
                ->where('category', 'ilike', $category->name)
                ->update(['category_id' => $category->id]);
        }
        ServiceDefinition::whereNull('category_id')
            ->where('category', 'ilike', 'Building%')
            ->update(['category_id' => $subcategoryIds['building']]);

        foreach (self::DEMO_SERVICES as [$name, $rootSlug, $childSlug, $price, $pricing]) {
            if (ServiceDefinition::where('name', $name)->exists()) {
                continue;
            }

            ServiceDefinition::create([
                'name' => $name,
                'category' => ServiceCategory::find($subcategoryIds[$rootSlug])->name,
                'category_id' => $subcategoryIds[$childSlug] ?? $subcategoryIds[$rootSlug],
                'description' => 'EverythingNeed demo service for local development.',
                'provider' => 'EverythingNeed Verified Partners',
                'pricing_mode' => $pricing,
                'base_price' => $price,
                'currency' => 'USD',
                'location' => 'Accra',
                'availability' => ['days' => 'Mon-Sat', 'hours' => '08:00-18:00'],
                'requires_booking' => true,
                'requires_payment' => false,
                'status' => ServiceDefinition::STATUS_ACTIVE,
            ]);
        }
    }
}
