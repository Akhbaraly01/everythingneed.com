<?php

namespace Tests\Feature\Services;

use Modules\Services\Entities\ServiceCategory;
use Modules\Services\Entities\ServiceDefinition;
use Tests\TestCase;

/**
 * Mega-phase M-1: service taxonomy (categories + subcategories + icons) -
 * admin console CRUD with usage guards, public active-only tree with live
 * service counts, catalog filtering by slug, and the legacy free-text
 * compatibility contract.
 */
class ServiceCategoryTest extends TestCase
{
    private function category(array $attributes = []): ServiceCategory
    {
        return ServiceCategory::create(array_merge([
            'name' => 'Home Cleaning',
            'slug' => 'home-cleaning',
            'icon' => 'sparkles',
            'color' => '#0EA5E9',
            'sort_order' => 1,
            'is_active' => true,
        ], $attributes));
    }

    private function service(array $attributes = []): ServiceDefinition
    {
        return ServiceDefinition::create(array_merge([
            'name' => 'Deep Clean Visit',
            'category' => 'Home Cleaning',
            'pricing_mode' => 'fixed',
            'base_price' => 100,
            'currency' => 'USD',
            'status' => ServiceDefinition::STATUS_ACTIVE,
        ], $attributes));
    }

    public function test_non_admin_cannot_use_the_taxonomy_console(): void
    {
        $user = $this->actingAsUser();

        $this->getJson('/api/admin/service-categories')->assertStatus(403);
        $this->postJson('/api/admin/service-categories', ['name' => 'X', 'slug' => 'x'])->assertStatus(403);
    }

    public function test_admin_creates_root_and_subcategory(): void
    {
        $this->actingAsAdmin();

        $parent = $this->postJson('/api/admin/service-categories', [
            'name' => 'Plumbing & Water',
            'slug' => 'plumbing',
            'icon' => 'droplets',
            'color' => '#06B6D4',
            'sort_order' => 3,
        ]);
        $parent->assertCreated();

        $child = $this->postJson('/api/admin/service-categories', [
            'name' => 'Leak Repair',
            'slug' => 'leak-repair',
            'parent_id' => $parent->json('data.id'),
        ]);
        $child->assertCreated();
        $this->assertSame($parent->json('data.id'), $child->json('data.parent_id'));

        $this->postJson('/api/admin/service-categories', [
            'name' => 'Bad Slug',
            'slug' => 'Not A Slug',
        ])->assertStatus(422);

        $this->postJson('/api/admin/service-categories', [
            'name' => 'Ghost',
            'slug' => 'ghost',
            'parent_id' => '00000000-0000-0000-0000-000000000000',
        ])->assertStatus(422);
    }

    public function test_public_tree_serves_active_only_with_live_service_counts(): void
    {
        $root = $this->category();
        $child = $this->category(['name' => 'Deep Cleaning', 'slug' => 'deep-cleaning', 'parent_id' => $root->id]);
        $this->category(['name' => 'Hidden', 'slug' => 'hidden', 'is_active' => false]);

        $this->service(['category_id' => $root->id]);
        $draft = $this->service(['name' => 'Draft Job', 'category_id' => $child->id]);
        $draft->update(['status' => ServiceDefinition::STATUS_DRAFT]);

        $res = $this->getJson('/api/service-categories');
        $res->assertOk();

        $data = $res->json('data');
        $this->assertCount(1, $data);
        $this->assertSame('home-cleaning', $data[0]['slug']);
        $this->assertSame(1, $data[0]['services_count']);
        $this->assertCount(1, $data[0]['children']);
        $this->assertSame(0, $data[0]['children'][0]['services_count']);
    }

    public function test_update_guards_cycles_and_syncs_legacy_display_string(): void
    {
        $root = $this->category();
        $child = $this->category(['name' => 'Deep Cleaning', 'slug' => 'deep-cleaning', 'parent_id' => $root->id]);

        $service = $this->service(['category_id' => $root->id]);

        $this->actingAsAdmin();

        $this->putJson("/api/admin/service-categories/{$root->id}", [
            'parent_id' => $root->id,
        ])->assertStatus(422);

        $this->putJson("/api/admin/service-categories/{$root->id}", [
            'parent_id' => $child->id,
        ])->assertStatus(422);

        $this->putJson("/api/admin/service-categories/{$root->id}", [
            'name' => 'Home Care',
        ])->assertOk();

        $this->assertSame('Home Care', $service->fresh()->category);
    }

    public function test_delete_is_guarded_while_in_use(): void
    {
        $root = $this->category();
        $child = $this->category(['name' => 'Deep Cleaning', 'slug' => 'deep-cleaning', 'parent_id' => $root->id]);

        $this->actingAsAdmin();

        // Root has a child -> protected.
        $this->deleteJson("/api/admin/service-categories/{$root->id}")->assertStatus(422);

        // Child is used by a service -> protected.
        $this->service(['category_id' => $child->id]);
        $this->deleteJson("/api/admin/service-categories/{$child->id}")->assertStatus(422);

        // Free the child, then both rows delete cleanly.
        ServiceDefinition::query()->delete();
        $this->deleteJson("/api/admin/service-categories/{$child->id}")->assertOk();
        $this->deleteJson("/api/admin/service-categories/{$root->id}")->assertOk();
    }

    public function test_catalog_filter_resolves_slug_and_keeps_legacy_prefix_match(): void
    {
        $root = $this->category();
        $tagged = $this->service(['category_id' => $root->id]);

        $legacy = $this->service([
            'name' => 'Legacy Build Job',
            'category' => 'Building Services',
        ]);

        $bySlug = $this->getJson('/api/services?category=home-cleaning');
        $bySlug->assertOk();
        $this->assertSame([$tagged->id], array_column($bySlug->json('data'), 'id'));

        $legacyRes = $this->getJson('/api/services?category=building');
        $legacyRes->assertOk();
        $this->assertSame([$legacy->id], array_column($legacyRes->json('data'), 'id'));
    }

    public function test_admin_service_create_accepts_category_id_and_syncs_legacy_string(): void
    {
        $root = $this->category();

        $this->actingAsAdmin();

        $res = $this->postJson('/api/admin/services', [
            'name' => 'Window Cleaning',
            'category_id' => $root->id,
            'pricing_mode' => 'fixed',
            'base_price' => 30,
            'currency' => 'USD',
            'status' => 'active',
        ]);

        $res->assertCreated();
        $this->assertSame($root->id, $res->json('data.category_id'));
        $this->assertSame('Home Cleaning', $res->json('data.category'));

        $this->postJson('/api/admin/services', [
            'name' => 'No Category At All',
            'pricing_mode' => 'fixed',
            'base_price' => 10,
            'status' => 'active',
        ])->assertStatus(422);
    }
}
