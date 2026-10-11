<?php

namespace Tests\Feature\WaveP;

use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * Wave P — spec 48: category management with SEO metadata, unique slugs,
 * hierarchical parenting without cycles, and RBAC on the mutations.
 */
class AdminCategoriesSeoTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\PermissionSeeder::class);
        Cache::forget('rbac.matrix');
    }

    public function test_store_persists_seo_fields_and_generates_slug(): void
    {
        $this->actingAsAdmin();

        $res = $this->postJson('/api/categories', [
            'name' => 'WaveP SEO Cats',
            'description' => 'SEO aware category.',
            'meta_title' => 'WaveP SEO Cats — best meta title',
            'meta_description' => 'A meta description for WaveP SEO Cats.',
            'meta_keywords' => 'wavep, seo, cats',
        ])->assertStatus(201);

        $this->assertSame('wavep-seo-cats', $res->json('data.slug'));
        $this->assertSame('WaveP SEO Cats — best meta title', $res->json('data.meta_title'));

        $show = $this->getJson('/api/categories/wavep-seo-cats')->assertOk();
        $this->assertSame('A meta description for WaveP SEO Cats.', $show->json('data.meta_description'));
        $this->assertSame('wavep, seo, cats', $show->json('data.meta_keywords'));
    }

    public function test_duplicate_names_get_unique_numeric_slugs(): void
    {
        $this->actingAsAdmin();

        $first = $this->postJson('/api/categories', ['name' => 'WaveP Duplicate Slug'])->assertStatus(201);
        $second = $this->postJson('/api/categories', ['name' => 'WaveP Duplicate Slug'])->assertStatus(201);

        $this->assertSame('wavep-duplicate-slug', $first->json('data.slug'));
        $this->assertSame('wavep-duplicate-slug-2', $second->json('data.slug'));
    }

    public function test_update_round_trips_seo_fields(): void
    {
        $this->actingAsAdmin();

        $created = $this->postJson('/api/categories', ['name' => 'WaveP Updatable'])->assertStatus(201);
        $id = $created->json('data.id');

        $this->putJson('/api/categories/' . $id, [
            'meta_title' => 'Updated meta title',
            'meta_description' => 'Updated meta description',
        ])->assertOk();

        $show = $this->getJson('/api/categories/' . $id)->assertOk();
        $this->assertSame('Updated meta title', $show->json('data.meta_title'));
        $this->assertSame('Updated meta description', $show->json('data.meta_description'));
    }

    public function test_self_and_descendant_parenting_is_rejected(): void
    {
        $this->actingAsAdmin();

        $parent = $this->postJson('/api/categories', ['name' => 'WaveP Tree Parent'])->assertStatus(201);
        $parentId = $parent->json('data.id');
        $child = $this->postJson('/api/categories', ['name' => 'WaveP Tree Child', 'parent_id' => $parentId])->assertStatus(201);
        $childId = $child->json('data.id');

        // A category can never be its own parent.
        $this->putJson('/api/categories/' . $childId, ['parent_id' => $childId])
            ->assertStatus(422)
            ->assertJson(['message' => 'A category cannot be nested under itself or its own child.']);

        // Nor can it be re-parented under its own descendant.
        $this->putJson('/api/categories/' . $parentId, ['parent_id' => $childId])
            ->assertStatus(422)
            ->assertJson(['message' => 'A category cannot be nested under itself or its own child.']);
    }

    public function test_category_admin_can_manage_but_plain_user_cannot(): void
    {
        $this->actingAsUser('category_admin');
        $this->postJson('/api/categories', ['name' => 'WaveP Category Admin Cat'])->assertStatus(201);
    }

    public function test_plain_user_cannot_mutate_categories(): void
    {
        $this->actingAsUser();

        $this->postJson('/api/categories', ['name' => 'Nope'])->assertStatus(403);
    }

    public function test_guest_cannot_mutate_categories(): void
    {
        $this->postJson('/api/categories', ['name' => 'Nope'])->assertStatus(401);
    }
}
