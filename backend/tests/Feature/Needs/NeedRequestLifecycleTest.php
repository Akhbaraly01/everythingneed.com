<?php

namespace Tests\Feature\Needs;

use Illuminate\Support\Str;
use Modules\Needs\Entities\NeedCategory;
use Modules\Needs\Entities\NeedRequest;
use Modules\Needs\Entities\NeedRequestEvent;
use Tests\TestCase;

/**
 * TODO 07 request lifecycle: idempotent submission, owner revision rules,
 * published-with-bids protection, and edit audit rows.
 */
class NeedRequestLifecycleTest extends TestCase
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

    private function payload(NeedCategory $category, array $over = []): array
    {
        return array_merge([
            'title' => 'Deep clean 3-bedroom apartment',
            'description' => 'Full deep clean including windows.',
            'category_id' => $category->id,
            'pricing_basis' => 'quote',
        ], $over);
    }

    public function test_retried_submit_with_same_client_key_returns_original(): void
    {
        $category = $this->category();
        $owner = $this->actingAsUser();
        $key = (string) Str::uuid();

        $first = $this->postJson('/api/need-requests', $this->payload($category, [
            'client_key' => $key,
        ]))->assertStatus(201);

        $eventsBefore = NeedRequestEvent::where('need_request_id', $first->json('data.id'))->count();

        $replay = $this->postJson('/api/need-requests', $this->payload($category, [
            'title' => 'Changed title on retry',
            'client_key' => $key,
        ]))->assertStatus(200);

        $this->assertEquals($first->json('data.id'), $replay->json('data.id'));
        $this->assertTrue((bool) $replay->json('replayed'));
        $this->assertEquals(
            $eventsBefore,
            NeedRequestEvent::where('need_request_id', $first->json('data.id'))->count()
        );
        $this->assertEquals(1, NeedRequest::where('user_id', $owner->id)->count());
    }

    public function test_different_client_key_creates_a_new_request(): void
    {
        $category = $this->category();
        $this->actingAsUser();

        $this->postJson('/api/need-requests', $this->payload($category, [
            'client_key' => (string) Str::uuid(),
        ]))->assertStatus(201);
        $this->postJson('/api/need-requests', $this->payload($category, [
            'client_key' => (string) Str::uuid(),
        ]))->assertStatus(201);

        $this->assertEquals(2, NeedRequest::count());
    }

    public function test_owner_can_edit_draft_with_audit_row(): void
    {
        $category = $this->category();
        $this->actingAsUser();

        $id = $this->postJson('/api/need-requests', $this->payload($category, [
            'save_as_draft' => true,
        ]))->assertStatus(201)->json('data.id');

        $this->putJson("/api/need-requests/{$id}", [
            'title' => 'Deep clean 4-bedroom apartment',
            'budget_max' => 200,
        ])->assertOk()->assertJsonFragment(['title' => 'Deep clean 4-bedroom apartment']);

        $this->assertDatabaseHas('need_request_events', [
            'need_request_id' => $id,
            'action' => 'edit',
        ]);
    }

    public function test_stranger_cannot_edit(): void
    {
        $category = $this->category();
        $this->actingAsUser();

        $id = $this->postJson('/api/need-requests', $this->payload($category, [
            'save_as_draft' => true,
        ]))->assertStatus(201)->json('data.id');

        $this->actingAsUser();
        $this->putJson("/api/need-requests/{$id}", ['title' => 'Hijacked'])->assertStatus(403);
    }

    public function test_guest_cannot_edit(): void
    {
        $category = $this->category();
        $owner = \App\Models\User::factory()->create();

        $request = NeedRequest::create([
            'user_id' => $owner->id,
            'category_id' => $category->id,
            'request_number' => 'NR-' . strtoupper(uniqid()),
            'title' => 'T',
            'description' => 'D',
            'status' => NeedRequest::STATUS_DRAFT,
        ]);

        $this->putJson("/api/need-requests/{$request->id}", ['title' => 'Hijacked'])->assertStatus(401);
    }

    public function test_published_request_cannot_be_edited_and_bids_freeze_it(): void
    {
        $category = $this->category();
        $owner = $this->actingAsUser();

        $id = $this->postJson('/api/need-requests', $this->payload($category))->assertStatus(201)->json('data.id');

        // Pending: edit allowed.
        $this->actingAs($owner, 'sanctum');
        $this->putJson("/api/need-requests/{$id}", ['title' => 'Still private'])->assertOk();

        // Published: public content freezes even with zero bids.
        NeedRequest::find($id)->update(['status' => NeedRequest::STATUS_PUBLISHED]);
        $this->putJson("/api/need-requests/{$id}", ['title' => 'Sneaky change'])
            ->assertStatus(422)
            ->assertJsonFragment(['message' => "Requests cannot be edited in status 'published'"]);

        // A provider bids: the freeze names the bids as the reason.
        $provider = $this->actingAsUser();
        $this->postJson("/api/need-requests/{$id}/offers", [
            'price' => 120,
            'message' => 'Available tomorrow.',
        ])->assertStatus(201);

        $this->actingAs($owner, 'sanctum');
        $this->putJson("/api/need-requests/{$id}", ['title' => 'Sneaky change'])
            ->assertStatus(422)
            ->assertJsonFragment(['message' => 'Providers have already bid; cancel and repost instead of editing']);
    }

    public function test_edit_is_refused_outside_editable_statuses(): void
    {
        $category = $this->category();
        $owner = $this->actingAsUser();

        $id = $this->postJson('/api/need-requests', $this->payload($category))->assertStatus(201)->json('data.id');
        NeedRequest::find($id)->update(['status' => NeedRequest::STATUS_ACCEPTED]);

        $this->actingAs($owner, 'sanctum');
        $this->putJson("/api/need-requests/{$id}", ['title' => 'Too late'])
            ->assertStatus(422);
    }
}
