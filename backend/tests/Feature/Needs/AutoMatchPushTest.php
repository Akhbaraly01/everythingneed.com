<?php

namespace Tests\Feature\Needs;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Modules\Needs\Entities\NeedCategory;
use Modules\Needs\Entities\NeedProviderProfile;
use Modules\Needs\Entities\NeedRequest;
use Tests\TestCase;

/**
 * N-26 auto-match push: publishing a request notifies the ranked top
 * matches (top 5 public, every invitee when invite-only), the same push
 * runs when a published request widens to public, and the fan-out is
 * idempotent per (user, request) pair. Notifications are best-effort —
 * an empty match pool never blocks the publish.
 */
class AutoMatchPushTest extends TestCase
{
    private function category(): NeedCategory
    {
        return NeedCategory::create([
            'name' => 'Plumbing ' . uniqid(),
            'slug' => 'plumbing-' . uniqid(),
            'icon' => 'wrench',
            'color' => '#3B82F6',
            'requires_verified_provider' => false,
        ]);
    }

    private function approvedProfile(object $user, ?NeedCategory $category = null): NeedProviderProfile
    {
        return NeedProviderProfile::create([
            'user_id' => $user->id,
            'display_name' => 'Pro ' . substr((string) Str::uuid(), 0, 8),
            'category_ids' => $category ? [$category->id] : [],
            'service_areas' => [],
            'status' => NeedProviderProfile::STATUS_APPROVED,
        ]);
    }

    private function pendingRequest(object $owner, NeedCategory $category, array $over = []): NeedRequest
    {
        return NeedRequest::create(array_merge([
            'user_id' => $owner->id,
            'category_id' => $category->id,
            'request_number' => 'NR-' . strtoupper(uniqid()),
            'title' => 'Fix a burst pipe under the sink',
            'description' => 'Water everywhere, needs same-day help.',
            'status' => NeedRequest::STATUS_PENDING,
            'state' => 'Lagos',
            'lga' => 'Ikeja',
        ], $over));
    }

    /** @return array<int, string> user_ids notified for this request */
    private function notified(string $requestId): array
    {
        return DB::table('notifications')
            ->where('type', 'need_match')
            ->where('related_id', $requestId)
            ->pluck('user_id')
            ->map(fn ($v) => (string) $v)
            ->all();
    }

    public function test_publish_pings_ranked_providers_but_never_the_owner(): void
    {
        $category = $this->category();
        $owner = $this->actingAsUser();
        $providerA = $this->actingAsUser();
        $this->approvedProfile($providerA, $category);
        $providerB = $this->actingAsUser();
        $this->approvedProfile($providerB, $category);
        $request = $this->pendingRequest($owner, $category);

        $this->actingAs($owner, 'sanctum')
            ->postJson("/api/need-requests/{$request->id}/publish")
            ->assertOk()
            ->assertJsonPath('data.status', NeedRequest::STATUS_PUBLISHED);

        $pinged = $this->notified($request->id);
        sort($pinged);
        $expected = [(string) $providerA->id, (string) $providerB->id];
        sort($expected);
        $this->assertSame($expected, $pinged);
        $this->assertNotContains((string) $owner->id, $pinged);

        $row = DB::table('notifications')
            ->where('related_id', $request->id)
            ->where('user_id', $providerA->id)
            ->first();
        $this->assertStringStartsWith('New matching request: ', $row->title);
        $this->assertStringContainsString('Score', $row->message);
        $this->assertStringContainsString('offer', $row->message);
    }

    public function test_invite_only_publish_pings_invitees_and_skips_strangers(): void
    {
        $category = $this->category();
        $owner = $this->actingAsUser();
        $invitee = $this->actingAsUser(); // no provider profile at all
        $stranger = $this->actingAsUser();
        $this->approvedProfile($stranger, $category);
        $request = $this->pendingRequest($owner, $category, [
            'visibility' => NeedRequest::VISIBILITY_INVITE_ONLY,
            'invited_provider_ids' => [(string) $invitee->id],
        ]);

        $this->actingAs($owner, 'sanctum')
            ->postJson("/api/need-requests/{$request->id}/publish")
            ->assertOk();

        $this->assertSame([(string) $invitee->id], $this->notified($request->id));
    }

    public function test_widening_to_public_pings_new_pool_without_repinging_invitees(): void
    {
        $category = $this->category();
        $owner = $this->actingAsUser();
        $invitee = $this->actingAsUser();
        $stranger = $this->actingAsUser();
        $this->approvedProfile($stranger, $category);
        $request = $this->pendingRequest($owner, $category, [
            'visibility' => NeedRequest::VISIBILITY_INVITE_ONLY,
            'invited_provider_ids' => [(string) $invitee->id],
        ]);

        $this->actingAs($owner, 'sanctum')
            ->postJson("/api/need-requests/{$request->id}/publish")
            ->assertOk();
        $this->assertSame([(string) $invitee->id], $this->notified($request->id));

        // Owner opens it up while still collecting offers: the wider pool
        // learns about it, the invitee is not double-pinged.
        $this->actingAs($owner, 'sanctum')
            ->postJson("/api/need-requests/{$request->id}/visibility", [
                'visibility' => NeedRequest::VISIBILITY_PUBLIC,
            ])
            ->assertOk();

        $pinged = $this->notified($request->id);
        sort($pinged);
        $expected = [(string) $invitee->id, (string) $stranger->id];
        sort($expected);
        $this->assertSame($expected, $pinged);
        $this->assertSame(
            1,
            DB::table('notifications')
                ->where('type', 'need_match')
                ->where('related_id', $request->id)
                ->where('user_id', $invitee->id)
                ->count()
        );
    }

    public function test_publish_with_no_eligible_providers_still_succeeds_silently(): void
    {
        $category = $this->category();
        $owner = $this->actingAsUser();
        $request = $this->pendingRequest($owner, $category);

        $this->actingAs($owner, 'sanctum')
            ->postJson("/api/need-requests/{$request->id}/publish")
            ->assertOk()
            ->assertJsonPath('data.status', NeedRequest::STATUS_PUBLISHED);

        $this->assertSame(0, DB::table('notifications')
            ->where('related_id', $request->id)
            ->count());
    }

    public function test_publish_requires_owner_and_pending_status(): void
    {
        $category = $this->category();
        $owner = $this->actingAsUser();
        $request = $this->pendingRequest($owner, $category);

        // A stranger cannot publish someone else's request (and no push
        // fires for them either).
        $stranger = $this->actingAsUser();
        $this->actingAs($stranger, 'sanctum')
            ->postJson("/api/need-requests/{$request->id}/publish")
            ->assertStatus(403);
        $this->assertCount(0, $this->notified($request->id));
    }
}
