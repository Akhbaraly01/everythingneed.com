<?php

namespace Tests\Feature\Web;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PageRenderSmokeTest extends TestCase
{
    use RefreshDatabase;

    public function test_iteration_26_pages_render_inertia_components(): void
    {
        $user = $this->createUser();

        // 2FA card lives in settings/Index (security tab)
        $this->actingAs($user, 'web')->get('/settings')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('settings/Index'));

        // Cart shows inventory availability + shipping rows
        $this->actingAs($user, 'web')->get('/cart')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('cart/Index'));

        // Checkout shows shipping row + server-authoritative payment total
        $this->actingAs($user, 'web')->get('/orders/checkout')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('orders/Checkout'));
    }

    public function test_admin_cms_page_renders_for_admin(): void
    {
        $admin = $this->createAdmin();

        $this->actingAs($admin, 'web')->get('/admin/cms')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('admin/Cms'));
    }

    public function test_admin_cms_page_blocks_plain_user(): void
    {
        $user = $this->createUser();

        // Inertia-safe: web 403 renders as redirect-back with error flash.
        $this->actingAs($user, 'web')->get('/admin/cms')
            ->assertStatus(302)
            ->assertSessionHas('error');
    }

    public function test_admin_navigation_page_renders_for_admin(): void
    {
        $admin = $this->createAdmin();

        $this->actingAs($admin, 'web')->get('/admin/navigation')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('admin/Navigation'));
    }

    public function test_admin_modules_page_renders_for_admin_and_content_manager(): void
    {
        $admin = $this->createAdmin();

        $this->actingAs($admin, 'web')->get('/admin/modules')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('admin/Modules'));

        $editor = $this->createUser();
        $this->assignRole($editor, 'content_manager');

        $this->actingAs($editor, 'web')->get('/admin/modules')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('admin/Modules'));
    }

    public function test_admin_modules_page_blocks_plain_user(): void
    {
        $user = $this->createUser();

        $this->actingAs($user, 'web')->get('/admin/modules')
            ->assertStatus(302)
            ->assertSessionHas('error');
    }

    public function test_property_my_listings_page_renders_for_authed_user(): void
    {
        $user = $this->createUser();

        $this->actingAs($user, 'web')->get('/properties/my-listings')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('properties/MyListings'));
    }

    public function test_property_my_listings_page_requires_auth(): void
    {
        $this->get('/properties/my-listings')->assertRedirect();
    }

    public function test_building_booking_page_passes_worker_query_param(): void
    {
        $user = $this->createUser();
        $workerId = '11111111-2222-3333-4444-555555555555';

        $this->actingAs($user, 'web')->get("/building-services/book?worker={$workerId}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('building-services/Booking')
                ->where('worker_id', $workerId));
    }

    public function test_account_privacy_and_sessions_pages_render(): void
    {
        $user = $this->createUser();

        $this->actingAs($user, 'web')->get('/account/privacy')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('account/Privacy'));

        $this->actingAs($user, 'web')->get('/account/sessions')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('account/Sessions'));
    }
}
