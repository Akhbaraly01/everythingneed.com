<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use App\Models\UserRole;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Modules\Admin\Entities\DynamicModule;
use Modules\Admin\Entities\DynamicModuleEntry;
use Tests\TestCase;

/**
 * W3 dynamic modules: schema CRUD, entry validation against field defs
 * (required/types/unknown-key stripping), permission gates, public
 * published-only reads and cascade delete.
 */
class DynamicModuleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        Cache::forget('rbac.matrix');
        Cache::forget('permission.scopes');
    }

    private function superAdmin(): User
    {
        $super = User::factory()->create();
        UserRole::create(['user_id' => $super->id, 'role' => 'super_admin']);
        $this->app['auth']->forgetGuards();
        $this->actingAs($super, 'sanctum');

        return $super;
    }

    private function makeModule(array $overrides = []): array
    {
        return $this->postJson('/api/admin/modules', array_merge([
            'name' => 'Testimonials',
            'slug' => 'testimonials',
            'fields' => [
                ['key' => 'quote', 'label' => 'Quote', 'type' => 'textarea', 'required' => true],
                ['key' => 'author', 'label' => 'Author', 'type' => 'text', 'required' => true],
                ['key' => 'rating', 'label' => 'Rating', 'type' => 'number', 'required' => false],
                ['key' => 'featured', 'label' => 'Featured', 'type' => 'boolean', 'required' => false],
            ],
        ], $overrides))->assertStatus(201)->json('data');
    }

    public function test_module_crud_and_schema_validation(): void
    {
        $this->superAdmin();

        $module = $this->makeModule();
        $this->assertSame('draft', $module['status']);

        // Bad field type rejected.
        $this->postJson('/api/admin/modules', [
            'name' => 'Bad',
            'slug' => 'bad',
            'fields' => [['key' => 'x', 'label' => 'X', 'type' => 'video']],
        ])->assertStatus(422);

        // Duplicate field keys rejected.
        $this->postJson('/api/admin/modules', [
            'name' => 'Dup',
            'slug' => 'dup',
            'fields' => [
                ['key' => 'x', 'label' => 'X', 'type' => 'text'],
                ['key' => 'x', 'label' => 'X2', 'type' => 'text'],
            ],
        ])->assertStatus(422);

        // Publish + list shows entry counts.
        $this->putJson("/api/admin/modules/{$module['id']}", ['status' => 'published'])->assertOk();
        $list = $this->getJson('/api/admin/modules')->assertOk()->json('data');
        $this->assertSame('published', collect($list)->firstWhere('slug', 'testimonials')['status']);
    }

    public function test_entry_validation_strips_unknown_keys_and_checks_types(): void
    {
        $this->superAdmin();
        $module = $this->makeModule();

        // Missing required field.
        $this->postJson("/api/admin/modules/{$module['id']}/entries", [
            'data' => ['author' => 'Ada'],
        ])->assertStatus(422);

        // Wrong type.
        $this->postJson("/api/admin/modules/{$module['id']}/entries", [
            'data' => ['quote' => 'Great!', 'author' => 'Ada', 'rating' => 'five stars'],
        ])->assertStatus(422);

        // Unknown keys stripped, boolean false accepted for optional field.
        $res = $this->postJson("/api/admin/modules/{$module['id']}/entries", [
            'status' => 'published',
            'data' => [
                'quote' => 'Great!',
                'author' => 'Ada',
                'rating' => 5,
                'featured' => false,
                'injected' => 'DROP TABLE',
            ],
        ])->assertStatus(201);

        $stored = $res->json('data.data');
        $this->assertSame('Great!', $stored['quote']);
        $this->assertSame(5, $stored['rating']);
        $this->assertFalse($stored['featured']);
        $this->assertArrayNotHasKey('injected', $stored);
    }

    public function test_permission_gates(): void
    {
        $this->superAdmin();
        $module = $this->makeModule();

        $user = User::factory()->create();
        UserRole::create(['user_id' => $user->id, 'role' => 'user']);
        $this->app['auth']->forgetGuards();
        $this->actingAs($user, 'sanctum');

        $this->getJson('/api/admin/modules')->assertForbidden();
        $this->postJson('/api/admin/modules', ['name' => 'Nope', 'slug' => 'nope', 'fields' => []])
            ->assertForbidden();
        $this->getJson("/api/admin/modules/{$module['id']}/entries")->assertForbidden();
    }

    public function test_public_reads_only_published(): void
    {
        $this->superAdmin();
        $module = $this->makeModule();

        // Draft module: invisible publicly.
        $this->getJson('/api/modules/testimonials')->assertNotFound();

        $this->putJson("/api/admin/modules/{$module['id']}", ['status' => 'published'])->assertOk();
        $this->postJson("/api/admin/modules/{$module['id']}/entries", [
            'status' => 'published',
            'data' => ['quote' => 'Hi', 'author' => 'Bo'],
        ])->assertStatus(201);
        $this->postJson("/api/admin/modules/{$module['id']}/entries", [
            'status' => 'draft',
            'data' => ['quote' => 'Hidden', 'author' => 'Mo'],
        ])->assertStatus(201);

        // Guest (no auth) sees the published module + only published entries.
        $this->app['auth']->forgetGuards();
        $meta = $this->getJson('/api/modules/testimonials')->assertOk()->json('data');
        $this->assertSame('Testimonials', $meta['name']);

        $entries = $this->getJson('/api/modules/testimonials/entries')->assertOk()->json('data');
        $this->assertCount(1, $entries);
        $this->assertSame('Hi', $entries[0]['data']['quote']);
    }

    public function test_moderated_module_routes_entries_through_approval(): void
    {
        $this->superAdmin();
        $module = $this->makeModule([
            'slug' => 'moderated',
            'status' => 'published',
            'requires_approval' => true,
            'approval_roles' => ['content_manager'],
        ]);

        // Published-intent entry stays draft and opens an approval request.
        $res = $this->postJson("/api/admin/modules/{$module['id']}/entries", [
            'status' => 'published',
            'data' => ['quote' => 'Review me', 'author' => 'Author'],
        ])->assertStatus(201);
        $this->assertSame('draft', $res->json('data.status'));
        $approvalId = $res->json('approval_request_id');
        $this->assertNotNull($approvalId);

        // Hidden publicly while pending.
        $this->app['auth']->forgetGuards();
        $this->assertCount(0, $this->getJson('/api/modules/moderated/entries')->assertOk()->json('data'));

        // Approve (super_admin bypasses the step role) -> published.
        $this->superAdmin();
        $this->postJson("/api/admin/approval-requests/{$approvalId}/approve")->assertOk();

        $this->assertSame('published', \Modules\Admin\Entities\DynamicModuleEntry::find($res->json('data.id'))->status);

        $this->app['auth']->forgetGuards();
        $entries = $this->getJson('/api/modules/moderated/entries')->assertOk()->json('data');
        $this->assertCount(1, $entries);
        $this->assertSame('Review me', $entries[0]['data']['quote']);

        // Plain draft intent opens no request.
        $this->superAdmin();
        $res2 = $this->postJson("/api/admin/modules/{$module['id']}/entries", [
            'status' => 'draft',
            'data' => ['quote' => 'WIP', 'author' => 'Author'],
        ])->assertStatus(201);
        $this->assertNull($res2->json('approval_request_id'));
    }

    public function test_delete_module_removes_entries_and_schema_shrink_is_guarded(): void
    {
        $this->superAdmin();
        $module = $this->makeModule();

        $entryId = $this->postJson("/api/admin/modules/{$module['id']}/entries", [
            'data' => ['quote' => 'Q', 'author' => 'A'],
        ])->assertStatus(201)->json('data.id');

        // Dropping a used field key is refused.
        $this->putJson("/api/admin/modules/{$module['id']}", [
            'fields' => [['key' => 'author', 'label' => 'Author', 'type' => 'text', 'required' => true]],
        ])->assertStatus(422);

        // Entry update merges + revalidates.
        $this->putJson("/api/admin/modules/{$module['id']}/entries/{$entryId}", [
            'data' => ['rating' => 4],
        ])->assertOk()->assertJsonPath('data.data.rating', 4);

        // Delete cascades to entries (no orphan rows).
        $this->deleteJson("/api/admin/modules/{$module['id']}")->assertOk();
        $this->assertNull(DynamicModule::find($module['id']));
        $this->assertSame(0, DynamicModuleEntry::where('module_id', $module['id'])->count());
        $this->assertSame(0, DB::table('dynamic_module_entries')->where('module_id', $module['id'])->count());
    }
}
