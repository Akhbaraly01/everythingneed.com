<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Modules\Categories\Entities\Category;
use Tests\TestCase;

/**
 * Master-plan T (P0): category-tree management honors the assigned scope.
 *
 * A scoped marketplace_admin may only mutate inside their own subtree;
 * cross-scope writes are 403, unassigned scopes fail closed, and the admin
 * categories page + dashboard card show only the subtree.
 */
class CategoryScopeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\PermissionSeeder::class);
        Cache::forget('rbac.matrix');
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

    private function makeTree(): array
    {
        $a = Category::create(['name' => 'Scope A', 'slug' => 'scope-a']);
        $child = Category::create(['name' => 'Scope A Child', 'slug' => 'scope-a-child', 'parent_id' => $a->id]);
        $b = Category::create(['name' => 'Scope B', 'slug' => 'scope-b']);

        return [$a, $child, $b];
    }

    public function test_scoped_admin_writes_only_inside_own_subtree(): void
    {
        [$a, $child, $b] = $this->makeTree();
        $admin = $this->roleUser('marketplace_admin', $a->id);
        $this->actingAs($admin, 'sanctum');

        // Cross-scope update + delete are forbidden.
        $this->putJson("/api/categories/{$b->id}", ['description' => 'hijack'])->assertStatus(403);
        $this->deleteJson("/api/categories/{$b->id}")->assertStatus(403);

        // In-scope update + child creation allowed.
        $this->putJson("/api/categories/{$a->id}", ['description' => 'mine'])->assertOk();
        $this->putJson("/api/categories/{$child->id}", ['description' => 'mine too'])->assertOk();
        $this->postJson('/api/categories', ['name' => 'Scope A Leaf', 'parent_id' => $a->id])
            ->assertStatus(201);

        // Top-level creation escapes the scope: forbidden.
        $this->postJson('/api/categories', ['name' => 'Rogue Top'])->assertStatus(403);
        // Reparenting into a foreign tree is forbidden.
        $this->putJson("/api/categories/{$child->id}", ['parent_id' => $b->id])->assertStatus(403);

        $this->assertDatabaseMissing('categories', ['slug' => 'rogue-top']);
    }

    public function test_unassigned_scope_fails_closed(): void
    {
        [$a] = $this->makeTree();
        $admin = $this->roleUser('marketplace_admin');
        $this->actingAs($admin, 'sanctum');

        $this->putJson("/api/categories/{$a->id}", ['description' => 'x'])->assertStatus(403);
        $this->postJson('/api/categories', ['name' => 'Nope', 'parent_id' => $a->id])->assertStatus(403);
        $this->deleteJson("/api/categories/{$a->id}")->assertStatus(403);
    }

    public function test_super_admin_keeps_full_access(): void
    {
        [$a, $child, $b] = $this->makeTree();
        $admin = $this->createAdmin();
        $this->actingAs($admin, 'sanctum');

        $this->putJson("/api/categories/{$b->id}", ['description' => 'global'])->assertOk();
        $this->postJson('/api/categories', ['name' => 'Global Top'])->assertStatus(201);
        $this->deleteJson("/api/categories/{$child->id}")->assertOk();
    }

    public function test_global_category_roles_keep_full_access(): void
    {
        [$a, $child, $b] = $this->makeTree();

        foreach (['category_admin', 'platform_ops'] as $role) {
            $user = User::factory()->create();
            \App\Models\UserRole::create(['user_id' => $user->id, 'role' => $role]);
            $this->actingAs($user, 'sanctum');

            $this->putJson("/api/categories/{$b->id}", ['description' => "touched by {$role}"])->assertOk();
            $this->postJson('/api/categories', ['name' => "Top by {$role}"])->assertStatus(201);
        }
    }

    public function test_categories_page_and_card_are_scoped(): void
    {
        [$a, $child, $b] = $this->makeTree();
        $admin = $this->roleUser('marketplace_admin', $a->id);

        $this->actingAs($admin, 'web')->get('/admin/categories')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/Categories')
                ->where('categories.0.name', 'Scope A')
                ->where('categories.1.name', 'Scope A Child')
                ->has('categories', 2));

        $this->actingAs($admin, 'web')->get('/admin')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('cards.2.label', 'Categories')
                ->where('cards.2.value', 2));
    }
}
