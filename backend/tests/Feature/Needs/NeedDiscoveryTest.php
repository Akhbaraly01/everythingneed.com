<?php

namespace Tests\Feature\Needs;

use Modules\Needs\Entities\NeedCategory;
use Modules\Needs\Entities\NeedItem;
use Modules\Needs\Entities\NeedRequest;
use Tests\TestCase;

/**
 * TODO 10 search + discovery: unified search never leaks private rows,
 * marketplace filters/sorts behave, and only eligible listings surface.
 */
class NeedDiscoveryTest extends TestCase
{
    private function category(): NeedCategory
    {
        return NeedCategory::create([
            'name' => 'Cleaning',
            'slug' => 'cleaning-' . uniqid(),
            'icon' => 'sparkles',
            'color' => '#10B981',
        ]);
    }

    public function test_unified_search_hides_non_public_needs(): void
    {
        $category = $this->category();
        $owner = $this->actingAsUser();
        $token = 'ZebraStripesUncommonWord';

        $draft = NeedRequest::create([
            'user_id' => $owner->id, 'category_id' => $category->id,
            'request_number' => 'NR-' . strtoupper(uniqid()),
            'title' => "Draft {$token} job", 'description' => 'Not public yet.',
            'status' => NeedRequest::STATUS_DRAFT,
        ]);
        $invite = NeedRequest::create([
            'user_id' => $owner->id, 'category_id' => $category->id,
            'request_number' => 'NR-' . strtoupper(uniqid()),
            'title' => "Invite {$token} job", 'description' => 'Private circle.',
            'status' => NeedRequest::STATUS_PUBLISHED,
            'visibility' => NeedRequest::VISIBILITY_INVITE_ONLY,
            'invited_provider_ids' => [$owner->id],
        ]);
        $public = NeedRequest::create([
            'user_id' => $owner->id, 'category_id' => $category->id,
            'request_number' => 'NR-' . strtoupper(uniqid()),
            'title' => "Public {$token} job", 'description' => 'Open to all.',
            'status' => NeedRequest::STATUS_PUBLISHED,
        ]);

        $res = $this->getJson("/api/search?q={$token}&type=needs")->assertOk();
        $ids = array_column($res->json('data.needs'), 'id');

        $this->assertContains($public->id, $ids);
        $this->assertNotContains($draft->id, $ids);
        $this->assertNotContains($invite->id, $ids);
    }

    public function test_unified_search_hides_unreviewed_services(): void
    {
        $category = $this->category();
        $owner = $this->actingAsUser();
        $token = 'QuixoticPlumbingToken';

        $draft = NeedItem::create([
            'user_id' => $owner->id, 'category_id' => $category->id,
            'name' => "Draft {$token} package", 'status' => NeedItem::STATUS_DRAFT,
        ]);
        $live = NeedItem::create([
            'user_id' => $owner->id, 'category_id' => $category->id,
            'name' => "Live {$token} package", 'status' => NeedItem::STATUS_PUBLISHED,
            'is_available' => true,
        ]);

        $res = $this->getJson("/api/search?q={$token}&type=services")->assertOk();
        $ids = array_column($res->json('data.services'), 'id');

        $this->assertContains($live->id, $ids);
        $this->assertNotContains($draft->id, $ids);
    }

    public function test_open_scope_filters_and_sorts(): void
    {
        $category = $this->category();
        $owner = $this->actingAsUser();

        $cheap = NeedRequest::create([
            'user_id' => $owner->id, 'category_id' => $category->id,
            'request_number' => 'NR-' . strtoupper(uniqid()),
            'title' => 'Cheap clean', 'description' => 'D',
            'status' => NeedRequest::STATUS_PUBLISHED,
            'budget_min' => 20, 'budget_max' => 40, 'state' => 'Lagos',
        ]);
        $pricey = NeedRequest::create([
            'user_id' => $owner->id, 'category_id' => $category->id,
            'request_number' => 'NR-' . strtoupper(uniqid()),
            'title' => 'Pricey clean', 'description' => 'D',
            'status' => NeedRequest::STATUS_PUBLISHED,
            'budget_min' => 200, 'budget_max' => 400, 'state' => 'Abuja',
        ]);

        // Budget window keeps only the overlap.
        $this->getJson('/api/need-requests?scope=open&budget_min=100&budget_max=300')
            ->assertOk()
            ->assertJsonFragment(['id' => $pricey->id])
            ->assertJsonMissing(['id' => $cheap->id]);

        // Geo filter.
        $this->getJson('/api/need-requests?scope=open&state=lagos')
            ->assertOk()
            ->assertJsonFragment(['id' => $cheap->id])
            ->assertJsonMissing(['id' => $pricey->id]);

        // Sort by budget descending puts the pricey job first.
        $sorted = $this->getJson('/api/need-requests?scope=open&sort=budget_desc')->assertOk();
        $ids = array_column($sorted->json('data'), 'id');
        $this->assertLessThan(
            array_search($cheap->id, $ids),
            array_search($pricey->id, $ids)
        );

        // Invalid sort is rejected, not ignored.
        $this->getJson('/api/need-requests?scope=open&sort=drop_table')->assertStatus(422);
    }

    public function test_task_board_filters_and_sorts(): void
    {
        $this->actingAsUser();

        $this->postJson('/api/tasks', [
            'title' => 'Cheap flyers task',
            'description' => 'Hand out flyers.',
            'quantity' => 100,
            'budget' => 30,
        ])->assertStatus(201);
        $this->postJson('/api/tasks', [
            'title' => 'Pricey murals task',
            'description' => 'Paint a mural.',
            'quantity' => 1,
            'budget' => 900,
        ])->assertStatus(201);

        $filtered = $this->getJson('/api/tasks?budget_min=500')->assertOk();
        $titles = array_column($filtered->json('data'), 'title');
        $this->assertContains('Pricey murals task', $titles);
        $this->assertNotContains('Cheap flyers task', $titles);

        $this->getJson('/api/tasks?sort=bogus')->assertStatus(422);
    }
}
