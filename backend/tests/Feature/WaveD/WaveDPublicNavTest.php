<?php

namespace Tests\Feature\WaveD;

use App\Models\User;
use App\Models\UserRole;
use Core\Services\Contracts\PublicNavigationInterface;
use Database\Seeders\NavigationSeeder;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Admin\Entities\Navigation;
use Modules\Admin\Entities\NavigationItem;
use Tests\TestCase;

/**
 * Wave D - public navigation consumption (spec S46 + S6/S7/S8): the shared
 * siteNav prop, per-viewer visibility (guest/auth/role), page-slug URL
 * resolution, device exposure, raw-row cache + builder invalidation, and
 * the starter NavigationSeeder.
 */
class WaveDPublicNavTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        Cache::forget('rbac.matrix');
        app(PublicNavigationInterface::class)->flush();
    }

    /** @return array<string, list<array<string, mixed>>> */
    private function menus(?User $user): array
    {
        return app(PublicNavigationInterface::class)->menus($user);
    }

    private function createUserWithRole(string $role): User
    {
        $user = User::factory()->create();
        UserRole::create(['user_id' => $user->id, 'role' => $role]);
        $this->app['auth']->forgetGuards();

        return $user;
    }

    /**
     * @param  list<array<string, mixed>>  $items
     */
    private function seedMenu(string $location, array $items, string $status = 'published', string $name = 'Menu'): string
    {
        $navigation = Navigation::create([
            'name' => $name,
            'location' => $location,
            'status' => $status,
        ]);

        foreach ($items as $order => $item) {
            NavigationItem::forceCreate([
                'id' => $item['id'] ?? (string) Str::uuid(),
                'navigation_id' => $navigation->id,
                'parent_id' => $item['parent_id'] ?? null,
                'title' => $item['title'],
                'url' => $item['url'] ?? null,
                'page_slug' => $item['page_slug'] ?? null,
                'visibility' => $item['visibility'] ?? 'all',
                'permissions' => $item['permissions'] ?? null,
                'device_visibility' => $item['device_visibility'] ?? null,
                'is_active' => $item['is_active'] ?? true,
                'sort_order' => $order,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        app(PublicNavigationInterface::class)->flush();

        return $navigation->id;
    }

    // ── Shared prop ──────────────────────────────────────────────────────────

    public function test_site_nav_is_shared_even_when_no_menus_are_seeded(): void
    {
        $this->get('/')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Home/Index')
            ->has('siteNav')
            ->has('siteNav.header', 0)
            ->has('siteNav.footer', 0)
            ->has('siteNav.mobile', 0)
            ->has('siteNav.category', 0)
            ->has('siteNav.more', 0));
    }

    public function test_http_responses_carry_the_seeded_menu(): void
    {
        $this->seed(NavigationSeeder::class);

        $this->get('/')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Home/Index')
            ->has('siteNav.header', 5)
            ->where('siteNav.header.0.title', 'Home')
            ->where('siteNav.header.0.url', '/')
            ->has('siteNav.mobile', 5)
            ->has('siteNav.footer', 3));
    }

    // ── Seeder ──────────────────────────────────────────────────────────────

    public function test_seeder_publishes_all_five_locations_and_is_idempotent(): void
    {
        $this->seed(NavigationSeeder::class);

        $menus = $this->menus(null);

        $this->assertSame(
            ['Home', 'Needs', 'Learn', 'Healthcare', 'Account'],
            array_column($menus['header'], 'title'),
        );
        $this->assertSame('/', $menus['header'][0]['url']);

        $this->assertSame('CATEGORIES', $menus['footer'][0]['title']);
        $this->assertCount(4, $menus['footer'][0]['children']);
        $this->assertSame('/products?category=electronics', $menus['footer'][0]['children'][0]['url']);

        $this->assertCount(5, $menus['mobile']);
        $this->assertSame('home', $menus['mobile'][0]['icon']);
        $this->assertSame('/', $menus['mobile'][0]['url']);

        $this->assertCount(7, $menus['category']);
        $this->assertSame('Deals', $menus['more'][0]['title']);

        // Idempotent: a second run must not duplicate menus.
        $this->seed(NavigationSeeder::class);
        $this->assertSame(5, Navigation::withTrashed()->count());
    }

    // ── Visibility ──────────────────────────────────────────────────────────

    public function test_guest_and_auth_visibility_filtering(): void
    {
        $this->seedMenu('header', [
            ['title' => 'Everyone', 'url' => '/'],
            ['title' => 'Guests only', 'url' => '/login', 'visibility' => 'guest'],
            ['title' => 'Members only', 'url' => '/account', 'visibility' => 'auth'],
        ]);

        $this->assertSame(['Everyone', 'Guests only'], array_column($this->menus(null)['header'], 'title'));

        $member = $this->createUserWithRole('user');
        $this->assertSame(['Everyone', 'Members only'], array_column($this->menus($member)['header'], 'title'));
    }

    public function test_role_visibility_follows_the_permission_matrix(): void
    {
        $this->seedMenu('header', [
            ['title' => 'CMS tools', 'url' => '/admin/cms', 'visibility' => 'role', 'permissions' => ['navigation.view']],
            ['title' => 'No perms listed', 'url' => '/somewhere', 'visibility' => 'role', 'permissions' => []],
        ]);

        // Fail closed: guests never see role items; neither do roles
        // without the permission - and an empty permission list hides it
        // even from super_admin (misconfiguration, not a free pass).
        $this->assertSame([], array_column($this->menus(null)['header'], 'title'));

        $customer = $this->createUserWithRole('user');
        $this->assertSame([], array_column($this->menus($customer)['header'], 'title'));

        $editor = $this->createUserWithRole('content_manager');
        $this->assertSame(['CMS tools'], array_column($this->menus($editor)['header'], 'title'));

        $admin = $this->createUserWithRole('super_admin');
        $this->assertSame(['CMS tools'], array_column($this->menus($admin)['header'], 'title'));
    }

    public function test_children_of_hidden_parents_are_promoted_not_dropped(): void
    {
        $parentId = (string) Str::uuid();
        $childId = (string) Str::uuid();

        $this->seedMenu('header', [
            ['id' => $parentId, 'title' => 'Members', 'url' => '/account', 'visibility' => 'auth'],
            ['id' => $childId, 'title' => 'Open child', 'url' => '/open', 'parent_id' => $parentId],
        ]);

        $guestHeader = $this->menus(null)['header'];
        $this->assertCount(1, $guestHeader);
        $this->assertSame('Open child', $guestHeader[0]['title']);
        $this->assertSame([], $guestHeader[0]['children']);
    }

    // ── Exclusion rules ─────────────────────────────────────────────────────

    public function test_draft_navigations_and_inactive_items_are_excluded(): void
    {
        $liveNavId = $this->seedMenu('header', [['title' => 'Live', 'url' => '/']], 'published', 'Published');
        $this->seedMenu('header', [['title' => 'Draft', 'url' => '/draft']], 'draft', 'Draft');

        NavigationItem::forceCreate([
            'id' => (string) Str::uuid(),
            'navigation_id' => $liveNavId,
            'title' => 'Switched off',
            'url' => '/off',
            'visibility' => 'all',
            'is_active' => false,
            'sort_order' => 9,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        app(PublicNavigationInterface::class)->flush();

        $this->assertSame(['Live'], array_column($this->menus(null)['header'], 'title'));
    }

    // ── Item DTO ────────────────────────────────────────────────────────────

    public function test_page_slug_items_resolve_to_the_cms_route(): void
    {
        $this->seedMenu('header', [
            ['title' => 'About', 'page_slug' => 'about-us'],
            ['title' => 'External', 'url' => 'https://example.com'],
        ]);

        $header = $this->menus(null)['header'];
        $this->assertSame('/p/about-us', $header[0]['url']);
        $this->assertSame('https://example.com', $header[1]['url']);
    }

    public function test_device_visibility_is_exposed_for_client_side_filtering(): void
    {
        $this->seedMenu('mobile', [
            ['title' => 'Desktop only', 'url' => '/a', 'device_visibility' => ['desktop']],
            ['title' => 'Any device', 'url' => '/b'],
        ]);

        $mobile = $this->menus(null)['mobile'];
        $this->assertSame(['desktop'], $mobile[0]['devices']);
        $this->assertNull($mobile[1]['devices']);
    }

    // ── Cache ───────────────────────────────────────────────────────────────

    public function test_builder_write_flushes_the_public_menu_cache(): void
    {
        $this->seed(NavigationSeeder::class);
        $this->assertSame('Home', $this->menus(null)['header'][0]['title']);

        $editor = $this->createUserWithRole('content_manager');
        $this->actingAs($editor, 'sanctum');

        $navId = Navigation::where('location', 'header')->firstOrFail()->id;
        $itemId = NavigationItem::where('navigation_id', $navId)->orderBy('sort_order')->firstOrFail()->id;

        $this->putJson("/api/admin/navigations/{$navId}/items", [
            'items' => [['id' => $itemId, 'title' => 'Start', 'url' => '/']],
        ])->assertOk();

        // Without the flush this would keep serving the cached "Home".
        $this->app['auth']->forgetGuards();
        $header = $this->menus(null)['header'];
        $this->assertSame('Start', $header[0]['title']);
        $this->assertCount(1, $header);
    }
}
