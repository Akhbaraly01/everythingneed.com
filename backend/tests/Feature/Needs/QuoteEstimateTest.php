<?php

namespace Tests\Feature\Needs;

use Modules\Needs\Entities\NeedCategory;
use Modules\Needs\Entities\NeedCostGuide;
use Tests\TestCase;

/**
 * N-35 quote calculator: scaled estimates from published cost guides,
 * 404 when no priced guide exists.
 */
class QuoteEstimateTest extends TestCase
{
    private function createCategory(): NeedCategory
    {
        return NeedCategory::create([
            'name' => 'Electrical',
            'slug' => 'electrical-' . uniqid(),
            'description' => 'Electrical work',
            'icon' => 'zap',
            'color' => '#F59E0B',
        ]);
    }

    private function createGuide(NeedCategory $category, array $overrides = []): NeedCostGuide
    {
        return NeedCostGuide::create(array_merge([
            'need_category_id' => $category->id,
            'slug' => 'electrical-costs-' . uniqid(),
            'title' => 'Electrical costs',
            'summary' => 'Typical electrical pricing.',
            'price_min' => 100,
            'price_max' => 500,
            'price_avg' => 250,
            'currency' => 'USD',
            'pricing_unit' => 'project',
            'status' => 'published',
        ], $overrides));
    }

    public function test_estimate_returns_scaled_range_from_published_guide(): void
    {
        $category = $this->createCategory();
        $this->createGuide($category);

        $response = $this->getJson("/api/need-estimates?category_id={$category->id}&quantity=2");

        $response->assertOk();
        $this->assertEquals(200, $response->json('data.estimate.price_min'));
        $this->assertEquals(1000, $response->json('data.estimate.price_max'));
        $this->assertEquals(500, $response->json('data.estimate.price_avg'));
        $this->assertSame(2, $response->json('data.estimate.quantity'));
        $this->assertSame('project', $response->json('data.estimate.pricing_unit'));
        $this->assertNotEmpty($response->json('data.guide.slug'));
    }

    public function test_estimate_defaults_to_quantity_one(): void
    {
        $category = $this->createCategory();
        $this->createGuide($category);

        $response = $this->getJson("/api/need-estimates?category_id={$category->id}");

        $response->assertOk();
        $this->assertEquals(100, $response->json('data.estimate.price_min'));
        $this->assertSame(1, $response->json('data.estimate.quantity'));
    }

    public function test_draft_guide_does_not_power_estimates(): void
    {
        $category = $this->createCategory();
        $this->createGuide($category, ['status' => 'draft']);

        $this->getJson("/api/need-estimates?category_id={$category->id}")
            ->assertNotFound();
    }

    public function test_category_without_guide_returns_404_not_a_fabricated_price(): void
    {
        $category = $this->createCategory();

        $this->getJson("/api/need-estimates?category_id={$category->id}")
            ->assertNotFound();
    }

    public function test_unknown_category_is_rejected(): void
    {
        $this->getJson('/api/need-estimates?category_id=00000000-0000-0000-0000-000000000000')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['category_id']);
    }
}
