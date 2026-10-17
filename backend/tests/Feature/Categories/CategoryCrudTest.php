<?php

namespace Tests\Feature\Categories;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Categories\Entities\Category;
use Tests\TestCase;

class CategoryCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_list_root_categories(): void
    {
        Category::create(['name' => 'Electronics', 'slug' => 'electronics']);
        Category::create(['name' => 'Parent', 'slug' => 'parent']);
        Category::create(['name' => 'Child', 'slug' => 'child', 'parent_id' => Category::where('slug', 'parent')->first()->id]);

        $res = $this->getJson('/api/categories');
        $res->assertOk();
        $this->assertCount(2, $res->json('data'));
    }

    public function test_guest_can_show_category_and_tree(): void
    {
        $c = Category::create(['name' => 'Books', 'slug' => 'books']);

        $this->getJson("/api/categories/{$c->id}")->assertOk()->assertJsonPath('data.name', 'Books');
        $this->getJson('/api/categories/tree')->assertOk();
        $this->getJson('/api/categories/'.\Illuminate\Support\Str::uuid())->assertNotFound();
    }

    public function test_public_listing_hides_inactive_categories_and_children(): void
    {
        $parent = Category::create(['name' => 'Active Parent', 'slug' => 'active-parent']);
        Category::create(['name' => 'Active Child', 'slug' => 'active-child', 'parent_id' => $parent->id]);
        Category::create(['name' => 'Inactive Child', 'slug' => 'inactive-child', 'parent_id' => $parent->id, 'is_active' => false]);
        Category::create(['name' => 'Inactive Root', 'slug' => 'inactive-root', 'is_active' => false]);

        $res = $this->getJson('/api/categories?per_page=50');
        $res->assertOk();
        $names = collect($res->json('data'))->pluck('name');
        $this->assertTrue($names->contains('Active Parent'));
        $this->assertFalse($names->contains('Inactive Root'));

        $root = collect($res->json('data'))->firstWhere('name', 'Active Parent');
        $childNames = collect($root['children'])->pluck('name');
        $this->assertTrue($childNames->contains('Active Child'));
        $this->assertFalse($childNames->contains('Inactive Child'));

        $tree = $this->getJson('/api/categories/tree');
        $tree->assertOk();
        $treeRoot = collect($tree->json('data'))->firstWhere('name', 'Active Parent');
        $treeChildNames = collect($treeRoot['children'])->pluck('name');
        $this->assertFalse($treeChildNames->contains('Inactive Child'));

        $legacy = $this->getJson('/api/categories?is_active=0&per_page=50');
        $legacyNames = collect($legacy->json('data'))->pluck('name');
        $this->assertTrue($legacyNames->contains('Inactive Root'), 'Explicit is_active=0 keeps the tooling view');
    }

    public function test_admin_can_create_update_delete_category(): void
    {
        $admin = $this->createAdmin();
        $this->actingAs($admin, 'sanctum');

        $res = $this->postJson('/api/categories', ['name' => 'Toys', 'description' => 'Fun']);
        $res->assertCreated();
        $id = $res->json('data.id');
        $this->assertDatabaseHas('categories', ['slug' => 'toys']);

        $this->putJson("/api/categories/{$id}", ['name' => 'Games'])->assertOk();
        $this->assertDatabaseHas('categories', ['id' => $id, 'name' => 'Games', 'slug' => 'games']);

        $this->deleteJson("/api/categories/{$id}")->assertOk();
        $this->assertSoftDeleted('categories', ['id' => $id]);
    }

    public function test_regular_user_cannot_mutate_categories(): void
    {
        $user = $this->createUser();
        $this->assignRole($user, 'user');
        $this->seed(\Database\Seeders\PermissionSeeder::class);
        \Illuminate\Support\Facades\Cache::forget('rbac.matrix');
        $this->actingAs($user, 'sanctum');

        $this->postJson('/api/categories', ['name' => 'Nope'])->assertForbidden();
    }

    public function test_guest_cannot_mutate_categories(): void
    {
        $this->postJson('/api/categories', ['name' => 'Nope'])->assertUnauthorized();
    }
}
