<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Messaging\Entities\Ticket;
use Tests\TestCase;

/**
 * Dashboard "Needs Attention" contract: live server-computed queues derived
 * on read (no admin_tasks table), each gated on the router-built admin href
 * registry that drives the sidebar, pushed only when count > 0. The
 * marketplace_admin approvals queue must stay in lockstep with the
 * (scoped, fail-closed) /admin/approvals page it links to.
 */
class AdminDashboardNeedsAttentionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        Cache::forget('rbac.matrix');
    }

    private function pendingProduct(string $name, string $category): void
    {
        $owner = User::factory()->create();
        $vendor = \Modules\Vendors\Entities\Vendor::create([
            'user_id' => $owner->id,
            'store_name' => 'Attention Store',
            'category' => 'general',
            'is_verified' => true,
        ]);

        $response = $this->actingAs($owner)->postJson('/api/products', [
            'vendor_id' => $vendor->id,
            'name' => $name,
            'category' => $category,
            'price' => 30,
            'stock_quantity' => 2,
        ]);
        $response->assertStatus(201);
    }

    private function pendingKyc(): void
    {
        DB::table('kyc_verifications')->insert([
            'id' => (string) Str::uuid(),
            'user_id' => User::factory()->create()->id,
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function openTicket(): void
    {
        Ticket::create([
            'user_id' => User::factory()->create()->id,
            'ticket_number' => 'TKT-' . strtoupper(uniqid()),
            'subject' => 'Needs attention',
            'description' => 'Open, unassigned ticket',
            'priority' => 'medium',
            'status' => 'open',
        ]);
    }

    private function roleUser(string $role, ?string $categoryId = null): User
    {
        $user = User::factory()->create();
        \App\Models\UserRole::create([
            'user_id' => $user->id,
            'role' => $role,
            'category_id' => $categoryId,
        ]);

        return $user;
    }

    public function test_super_admin_sees_live_queues_computed_from_real_rows(): void
    {
        $this->pendingProduct('Pending Widget', 'electronics');
        $this->pendingKyc();
        $this->openTicket();

        $admin = $this->roleUser('super_admin');

        $this->actingAs($admin, 'web')->get('/admin')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/Dashboard')
                ->has('needsAttention', 4)
                ->where('needsAttention.0.label', 'Products awaiting approval')
                ->where('needsAttention.0.count', 1)
                ->where('needsAttention.0.href', '/admin/approvals')
                ->where('needsAttention.1.label', 'KYC reviews pending')
                ->where('needsAttention.1.count', 1)
                ->where('needsAttention.1.href', '/admin/kyc')
                ->where('needsAttention.2.label', 'Support tickets open')
                ->where('needsAttention.2.count', 1)
                ->where('needsAttention.2.href', '/admin/support/tickets')
                ->where('needsAttention.3.label', 'Tickets unassigned')
                ->where('needsAttention.3.count', 1)
                ->where('needsAttention.3.href', '/admin/support/tickets'));
    }

    public function test_empty_database_renders_an_honest_empty_queue_list(): void
    {
        $admin = $this->roleUser('super_admin');

        $this->actingAs($admin, 'web')->get('/admin')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/Dashboard')
                ->has('needsAttention', 0));
    }

    public function test_role_without_a_queue_href_never_sees_that_queue(): void
    {
        // Real pending work exists, but content_manager cannot open any of
        // the queue target pages (/admin, /admin/cms, /admin/newsletter only)
        // — so no queue may be rendered for it.
        $this->pendingProduct('Hidden Pending', 'electronics');
        $this->pendingKyc();
        $this->openTicket();

        $editor = $this->roleUser('content_manager');

        $this->actingAs($editor, 'web')->get('/admin')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/Dashboard')
                ->has('needsAttention', 0));
    }

    public function test_marketplace_admin_queue_and_card_honor_the_category_scope(): void
    {
        $this->pendingProduct('In Scope Widget', 'electronics');
        $this->pendingProduct('Out Of Scope Widget', 'home');

        $category = \Modules\Categories\Entities\Category::create([
            'name' => 'electronics',
            'slug' => 'electronics',
        ]);
        $admin = $this->roleUser('marketplace_admin', $category->id);

        $this->actingAs($admin, 'web')->get('/admin')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/Dashboard')
                ->has('needsAttention', 1)
                ->where('needsAttention.0.label', 'Products awaiting approval')
                ->where('needsAttention.0.count', 1)
                ->where('needsAttention.0.href', '/admin/approvals')
                ->where('cards.1.label', 'Pending Approvals')
                ->where('cards.1.value', 1));
    }

    public function test_unassigned_marketplace_admin_fails_closed_like_the_approvals_page(): void
    {
        $this->pendingProduct('Unreachable Pending', 'electronics');
        $admin = $this->roleUser('marketplace_admin');

        $this->actingAs($admin, 'web')->get('/admin')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/Dashboard')
                ->has('needsAttention', 0)
                ->where('cards.1.label', 'Pending Approvals')
                ->where('cards.1.value', 0));
    }

    public function test_kyc_reviewer_sees_only_the_kyc_queue(): void
    {
        $this->pendingKyc();
        $this->pendingProduct('Elsewhere Pending', 'electronics');

        $reviewer = $this->roleUser('kyc_reviewer');

        $this->actingAs($reviewer, 'web')->get('/admin')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/Dashboard')
                ->has('needsAttention', 1)
                ->where('needsAttention.0.label', 'KYC reviews pending')
                ->where('needsAttention.0.count', 1)
                ->where('needsAttention.0.href', '/admin/kyc'));
    }

    public function test_super_admin_stats_render_once_without_duplicate_cards(): void
    {
        $admin = $this->roleUser('super_admin');

        $this->actingAs($admin, 'web')->get('/admin')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/Dashboard')
                ->has('stats', 6)
                ->has('cards', 0));
    }
}
