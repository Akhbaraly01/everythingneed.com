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
