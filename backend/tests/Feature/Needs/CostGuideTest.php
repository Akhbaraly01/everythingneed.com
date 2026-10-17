<?php

namespace Tests\Feature\Needs;

use Modules\Needs\Entities\NeedCategory;
use Modules\Needs\Entities\NeedCostGuide;
use Tests\TestCase;

/**
 * N-29 cost guides: published-only public scoping, admin CRUD,
 * permission gates, and price-coherence validation.
 */
class CostGuideTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\PermissionSeeder::class);
    }

    private function createCategory(array $overrides = []): NeedCategory
    {
        return NeedCategory::create(array_merge([
            'name' => 'Plumbing',
            'slug' => 'plumbing-' . uniqid(),
            'description' => 'Plumbing services',
            'icon' => 'wrench',
            'color' => '#3B82F6',
        ], $overrides));
    }

    private function createGuide(NeedCategory $category, array $overrides = []): NeedCostGuide
    {
        return NeedCostGuide::create(array_merge([
            'need_category_id' => $category->id,
            'slug' => 'how-much-does-a-plumber-cost-' . uniqid(),
            'title' => 'How much does a plumber cost?',
            'summary' => 'Typical plumber pricing by job type.',
            'price_min' => 100,
            'price_max' => 500,
            'price_avg' => 250,
            'currency' => 'USD',
            'pricing_unit' => 'project',
            'status' => 'published',
        ], $overrides));
    }

    // ── Public scoping ──────────────────────────────────────────────

    public function test_public_list_returns_only_published_guides(): void
    {
        $category = $this->createCategory();
        $this->createGuide($category, ['status' => 'published']);
        $this->createGuide($category, ['status' => 'draft']);

        $response = $this->getJson('/api/need-cost-guides');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertSame('published', $response->json('data.0.status'));
    }

    public function test_public_list_filters_by_category_slug(): void
    {
        $plumbing = $this->createCategory();
        $cleaning = $this->createCategory(['name' => 'Cleaning', 'slug' => 'cleaning-' . uniqid()]);
        $this->createGuide($plumbing);
        $this->createGuide($cleaning, [
            'slug' => 'deep-cleaning-costs-' . uniqid(),
            'title' => 'Deep cleaning costs',
        ]);

        $response = $this->getJson('/api/need-cost-guides?category_slug=' . $cleaning->slug);

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertSame('Deep cleaning costs', $response->json('data.0.title'));
    }

    public function test_public_show_by_slug_returns_guide_with_category(): void
    {
        $category = $this->createCategory();
        $guide = $this->createGuide($category);

        $response = $this->getJson('/api/need-cost-guides/' . $guide->slug);

        $response->assertOk();
        $this->assertSame($guide->id, $response->json('data.id'));
        $this->assertSame('Plumbing', $response->json('data.category.name'));
    }

    public function test_draft_guide_is_not_publicly_visible(): void
    {
        $category = $this->createCategory();
        $guide = $this->createGuide($category, ['status' => 'draft']);

        $this->getJson('/api/need-cost-guides/' . $guide->slug)->assertNotFound();
    }

    // ── Admin gates ─────────────────────────────────────────────────

    public function test_guest_cannot_access_admin_cost_guides(): void
    {
        $this->getJson('/api/admin/needs/cost-guides')->assertStatus(401);
    }

    public function test_plain_user_cannot_access_admin_cost_guides(): void
    {
        $user = $this->actingAsUser();

        $this->getJson('/api/admin/needs/cost-guides')->assertStatus(403);

        $this->postJson('/api/admin/needs/cost-guides', ['title' => 'x'])->assertStatus(403);
    }

    public function test_needs_admin_can_crud_cost_guides(): void
    {
        $this->actingAsUser('needs_admin');
        $category = $this->createCategory();

        // Create
        $created = $this->postJson('/api/admin/needs/cost-guides', [
            'need_category_id' => $category->id,
            'title' => 'Electrician costs',
            'summary' => 'What electricians charge for common jobs.',
            'price_min' => 80,
            'price_max' => 600,
            'price_avg' => 250,
            'pricing_unit' => 'project',
            'status' => 'published',
            'factors' => [
                ['label' => 'Panel upgrades', 'impact' => 'high'],
            ],
            'faqs' => [
                ['question' => 'Hourly rates?', 'answer' => '$50-$120/hr typically.'],
            ],
        ]);
        $created->assertStatus(201);
        $id = $created->json('data.id');
        $this->assertSame('electrician-costs', $created->json('data.slug'));

        // List
        $this->getJson('/api/admin/needs/cost-guides')->assertOk()
            ->assertJsonPath('meta.total', 1);

        // Update
        $this->putJson("/api/admin/needs/cost-guides/{$id}", ['status' => 'draft'])
            ->assertOk()
            ->assertJsonPath('data.status', 'draft');

        // Draft now hidden publicly
        $this->getJson('/api/need-cost-guides')->assertOk()
            ->assertJsonPath('meta.total', 0);

        // Delete
        $this->deleteJson("/api/admin/needs/cost-guides/{$id}")->assertOk();
        $this->assertSoftDeleted('need_cost_guides', ['id' => $id]);
    }

    public function test_duplicate_slug_is_rejected(): void
    {
        $this->actingAsUser('needs_admin');
        $category = $this->createCategory();
        $this->createGuide($category, ['slug' => 'shared-slug']);

        $this->postJson('/api/admin/needs/cost-guides', [
            'need_category_id' => $category->id,
            'title' => 'Another guide',
            'summary' => 'Second guide with same slug.',
            'slug' => 'shared-slug',
        ])->assertStatus(422)->assertJsonValidationErrors(['slug']);
    }

    // ── Price coherence ─────────────────────────────────────────────

    public function test_price_min_cannot_exceed_price_max(): void
    {
        $this->actingAsUser('needs_admin');
        $category = $this->createCategory();

        $this->postJson('/api/admin/needs/cost-guides', [
            'need_category_id' => $category->id,
            'title' => 'Bad prices',
            'summary' => 'Inverted range.',
            'price_min' => 500,
            'price_max' => 100,
        ])->assertStatus(422);
    }

    public function test_price_avg_must_stay_within_range(): void
    {
        $this->actingAsUser('needs_admin');
        $category = $this->createCategory();

        $this->postJson('/api/admin/needs/cost-guides', [
            'need_category_id' => $category->id,
            'title' => 'Avg above max',
            'summary' => 'Average outside range.',
            'price_min' => 100,
            'price_max' => 500,
            'price_avg' => 900,
        ])->assertStatus(422);
    }

    public function test_unknown_category_is_rejected(): void
    {
        $this->actingAsUser('needs_admin');

        $this->postJson('/api/admin/needs/cost-guides', [
            'need_category_id' => '00000000-0000-0000-0000-000000000000',
            'title' => 'Orphan',
            'summary' => 'No category.',
        ])->assertStatus(422)->assertJsonValidationErrors(['need_category_id']);
    }
}
