<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Modules\Admin\Entities\Navigation;
use Modules\Admin\Entities\NavigationItem;

/**
 * Starter menus for the five public locations (spec S46/S8).
 *
 * Mirrors the pre-DB defaults the marketplace components used to hard-code,
 * so a fresh install renders a complete header/footer/mobile/category/more
 * navigation that admins can then edit without touching source code.
 * Idempotent: any existing navigation (draft or published) means an admin
 * already owns the menus, so this seeds nothing.
 */
class NavigationSeeder extends Seeder
{
    public function run(): void
    {
        if (Navigation::withTrashed()->exists()) {
            return;
        }

        $this->seedMenu('Main Header Menu', 'header', [
            ['title' => 'Home', 'url' => '/'],
            ['title' => 'Needs', 'url' => '/needs'],
            ['title' => 'Learn', 'url' => '/learn'],
            ['title' => 'Healthcare', 'url' => '/healthcare'],
            ['title' => 'Account', 'url' => '/account'],
        ]);

        $this->seedMenu('Footer Menu', 'footer', [
            [
                'title' => 'CATEGORIES',
                'children' => [
                    ['title' => 'Electronics', 'url' => '/products?category=electronics'],
                    ['title' => 'Fashion', 'url' => '/products?category=fashion'],
                    ['title' => 'Healthcare', 'url' => '/healthcare'],
                    ['title' => 'Learning', 'url' => '/learn'],
                ],
            ],
            [
                'title' => 'MY ACCOUNT',
                'children' => [
                    ['title' => 'Dashboard', 'url' => '/dashboard'],
                    ['title' => 'My Orders', 'url' => '/orders'],
                    ['title' => 'Wishlist', 'url' => '/wishlist'],
                    ['title' => 'Wallet', 'url' => '/wallet'],
                ],
            ],
            [
                'title' => 'SUPPORT',
                'children' => [
                    ['title' => 'Contact Us', 'url' => '/tickets'],
                    ['title' => 'Help Center', 'url' => '/tickets'],
                    ['title' => 'FAQs', 'url' => '/tickets'],
                ],
            ],
        ]);

        $this->seedMenu('Mobile Bottom Bar', 'mobile', [
            ['title' => 'Home', 'url' => '/', 'icon' => 'home'],
            ['title' => 'Needs', 'url' => '/needs', 'icon' => 'file-text'],
            ['title' => 'Learn', 'url' => '/learn', 'icon' => 'graduation-cap'],
            ['title' => 'Health', 'url' => '/healthcare', 'icon' => 'heart'],
            ['title' => 'Account', 'url' => '/account', 'icon' => 'user'],
        ]);

        $this->seedMenu('Category Menu', 'category', [
            ['title' => 'Learning', 'url' => '/learn'],
            ['title' => 'Healthcare', 'url' => '/healthcare'],
            ['title' => 'Pharmacy', 'url' => '/pharmacy'],
            ['title' => 'Needs', 'url' => '/needs'],
            ['title' => 'Hotels', 'url' => '/hotels'],
            ['title' => 'Jobs', 'url' => '/jobs'],
            ['title' => 'Tasks', 'url' => '/tasks'],
        ]);

        $this->seedMenu('More Menu', 'more', [
            ['title' => 'Deals', 'url' => '/deals'],
            ['title' => 'Experts', 'url' => '/experts'],
            ['title' => 'Food', 'url' => '/food'],
            ['title' => 'Hotels', 'url' => '/hotels'],
            ['title' => 'Flights', 'url' => '/flights'],
            ['title' => 'Real Estate', 'url' => '/properties'],
            ['title' => 'Agriculture', 'url' => '/agriculture'],
            ['title' => 'Transportation', 'url' => '/transportation'],
            ['title' => 'Building Services', 'url' => '/building-services'],
            ['title' => 'Job Seekers', 'url' => '/job-seekers'],
            ['title' => 'Pharmacy', 'url' => '/pharmacy'],
        ]);

        app(\Core\Services\Contracts\PublicNavigationInterface::class)->flush();
    }

    /**
     * Create one published navigation with nested items.
     *
     * @param  list<array<string, mixed>>  $items
     */
    private function seedMenu(string $name, string $location, array $items): void
    {
        $navigation = Navigation::create([
            'name' => $name,
            'location' => $location,
            'status' => 'published',
        ]);

        $this->seedItems($navigation, $items, null, 0);
    }

    /**
     * Items are nested via `children`; sort_order is the list position.
     *
     * @param  list<array<string, mixed>>  $items
     */
    private function seedItems(Navigation $navigation, array $items, ?string $parentId, int $startOrder): int
    {
        $order = $startOrder;

        foreach ($items as $item) {
            $id = (string) Str::uuid();

            NavigationItem::forceCreate([
                'id' => $id,
                'navigation_id' => $navigation->id,
                'parent_id' => $parentId,
                'title' => $item['title'],
                'url' => $item['url'] ?? null,
                'page_slug' => $item['page_slug'] ?? null,
                'icon' => $item['icon'] ?? null,
                'visibility' => $item['visibility'] ?? 'all',
                'permissions' => $item['permissions'] ?? null,
                'device_visibility' => $item['device_visibility'] ?? null,
                'sort_order' => $order,
                'is_active' => true,
                'open_in_new_tab' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $order++;

            if (! empty($item['children']) && is_array($item['children'])) {
                $order = $this->seedItems($navigation, $item['children'], $id, $order);
            }
        }

        return $order;
    }
}
