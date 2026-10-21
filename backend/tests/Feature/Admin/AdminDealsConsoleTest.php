<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Modules\Needs\Entities\NeedCategory;
use Modules\Needs\Entities\NeedItem;
use Tests\TestCase;

class AdminDealsConsoleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        Cache::forget('rbac.matrix');
    }

    private function category(): NeedCategory
    {
        return NeedCategory::create([
            'name' => 'Deals ' . uniqid(),
            'slug' => 'deals-' . uniqid(),
            'description' => 'Deals category',
            'icon' => 'tag',
            'color' => '#10B981',
        ]);
    }

    private function deal(array $overrides = []): NeedItem
    {
        return NeedItem::create(array_merge([
            'category_id' => $this->category()->id,
            'user_id' => User::factory()->create()->id,
            'name' => 'Deal ' . uniqid(),
            'description' => 'A great deal',
            'price' => 40,
            'status' => NeedItem::STATUS_PUBLISHED,
            'is_available' => true,
        ], $overrides));
    }

    public function test_administrator_can_list_and_filter_deals(): void
    {
        $deal = $this->deal();
        $hidden = $this->deal(['is_available' => false]);

        $this->actingAsUser('administrator');

        $this->getJson('/api/admin/deals')
            ->assertOk()
            ->assertJsonFragment(['id' => $deal->id])
            ->assertJsonFragment(['id' => $hidden->id]);

        $this->getJson('/api/admin/deals?visibility=hidden')
            ->assertOk()
            ->assertJsonFragment(['id' => $hidden->id])
            ->assertJsonMissing(['id' => $deal->id]);

        $this->getJson('/api/admin/deals/overview')
            ->assertOk()
            ->assertJsonPath('data.total', 2)
            ->assertJsonPath('data.live', 1)
            ->assertJsonPath('data.hidden', 1);
    }

    public function test_visibility_toggle_hides_and_restores_a_published_deal(): void
    {
        $deal = $this->deal();

        $this->actingAsUser('administrator');

        $this->postJson("/api/admin/deals/{$deal->id}/visibility", [
            'is_available' => false,
        ])->assertOk();
        $this->assertFalse($deal->fresh()->is_available);

        $this->postJson("/api/admin/deals/{$deal->id}/visibility", [
            'is_available' => true,
        ])->assertOk();
        $this->assertTrue($deal->fresh()->is_available);
    }

    public function test_unpublished_deal_cannot_be_made_live(): void
    {
        $deal = $this->deal(['status' => NeedItem::STATUS_DRAFT, 'is_available' => false]);

        $this->actingAsUser('administrator');

        $this->postJson("/api/admin/deals/{$deal->id}/visibility", [
            'is_available' => true,
        ])->assertStatus(422);
    }

    public function test_status_moderation_uses_the_needs_workflow(): void
    {
        $deal = $this->deal(['status' => NeedItem::STATUS_SUBMITTED]);

        $this->actingAsUser('administrator');

        $this->postJson("/api/admin/deals/{$deal->id}/moderate", [
            'action' => 'approve',
        ])->assertOk();

        $this->assertSame(NeedItem::STATUS_APPROVED, $deal->fresh()->status);
    }

    public function test_other_domain_admin_is_forbidden(): void
    {
        $this->actingAsUser('food_admin');

        $this->getJson('/api/admin/deals')->assertStatus(403);
        $this->postJson('/api/admin/deals/' . $this->deal()->id . '/visibility', [
            'is_available' => false,
        ])->assertStatus(403);
    }
}
