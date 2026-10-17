<?php

namespace Tests\Feature\Needs;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Modules\Needs\Entities\NeedCategory;
use Modules\Needs\Entities\NeedProviderProfile;
use Modules\Needs\Entities\NeedRequest;
use Tests\TestCase;

/**
 * N-27 live availability: the pause switch drops providers out of
 * matching and the auto-match push without touching vetting, and the
 * applicant payload tells owners who is on call right now.
 */
class ProviderAvailabilityTest extends TestCase
{
    private function category(): NeedCategory
    {
        return NeedCategory::create([
            'name' => 'Electrical ' . uniqid(),
            'slug' => 'electrical-' . uniqid(),
            'icon' => 'zap',
            'color' => '#F59E0B',
            'requires_verified_provider' => false,
        ]);
    }

    private function approvedProfile(object $user, NeedCategory $category, bool $available = true): NeedProviderProfile
    {
        return NeedProviderProfile::create([
            'user_id' => $user->id,
            'display_name' => 'Pro ' . substr((string) Str::uuid(), 0, 8),
            'category_ids' => [$category->id],
            'service_areas' => [],
            'status' => NeedProviderProfile::STATUS_APPROVED,
            'is_available' => $available,
            'reviewed_at' => now(),
        ]);
    }

    private function pendingRequest(object $owner, NeedCategory $category): NeedRequest
    {
        return NeedRequest::create([
            'user_id' => $owner->id,
            'category_id' => $category->id,
            'request_number' => 'NR-' . strtoupper(uniqid()),
            'title' => 'Rewire a kitchen',
            'description' => 'Old wiring, needs full check.',
            'status' => NeedRequest::STATUS_PENDING,
            'state' => 'Lagos',
            'lga' => 'Ikeja',
        ]);
    }

    public function test_paused_provider_drops_out_of_matching_and_auto_push(): void
    {
        $category = $this->category();
        $owner = $this->actingAsUser();

        $active = $this->actingAsUser();
        $this->approvedProfile($active, $category);
        $paused = $this->actingAsUser();
        $this->approvedProfile($paused, $category, available: false);

        $request = $this->pendingRequest($owner, $category);

        $matches = $this->actingAs($owner, 'sanctum')
            ->getJson("/api/need-requests/{$request->id}/matches")
            ->assertOk()
            ->json('data.matches');
        $matchedIds = array_column($matches, 'user_id');
        $this->assertContains((string) $active->id, $matchedIds);
        $this->assertNotContains((string) $paused->id, $matchedIds);

        // The N-26 push follows the same gate: only the active provider
        // learns about the publish.
        $this->actingAs($owner, 'sanctum')
            ->postJson("/api/need-requests/{$request->id}/publish")
            ->assertOk();

        $pinged = DB::table('notifications')
            ->where('type', 'need_match')
            ->where('related_id', $request->id)
            ->pluck('user_id')
            ->map(fn ($v) => (string) $v)
            ->all();
        $this->assertSame([(string) $active->id], $pinged);
    }

    public function test_toggle_flips_availability_without_touching_vetting(): void
    {
        $category = $this->category();
        $provider = $this->actingAsUser();
        $profile = $this->approvedProfile($provider, $category);

        // Pause.
        $this->actingAs($provider, 'sanctum')
            ->postJson('/api/provider-profile/availability', ['is_available' => false])
            ->assertOk()
            ->assertJsonPath('data.is_available', false)
            ->assertJsonPath('data.status', NeedProviderProfile::STATUS_APPROVED);

        $row = DB::table('need_provider_profiles')->where('id', $profile->id)->first();
        $this->assertSame(NeedProviderProfile::STATUS_APPROVED, $row->status);
        $this->assertFalse((bool) $row->is_available);
        $this->assertNotNull($row->reviewed_at);

        // Resume.
        $this->actingAs($provider, 'sanctum')
            ->postJson('/api/provider-profile/availability', ['is_available' => true])
            ->assertOk()
            ->assertJsonPath('data.is_available', true);
    }

    public function test_toggle_requires_auth_a_profile_and_a_boolean(): void
    {
        // Guest first — actingAs(sanctum) sticks for the rest of a test,
        // so auth guards are asserted in their own method.
        $this->postJson('/api/provider-profile/availability', ['is_available' => true])
            ->assertStatus(401);

        // Authenticated but profile-less: honest 404, never a silent row.
        $profileless = $this->actingAsUser();
        $this->actingAs($profileless, 'sanctum')
            ->postJson('/api/provider-profile/availability', ['is_available' => true])
            ->assertNotFound();

        // Profile exists → value required.
        $category = $this->category();
        $provider = $this->actingAsUser();
        $this->approvedProfile($provider, $category);
        $this->actingAs($provider, 'sanctum')
            ->postJson('/api/provider-profile/availability', [])
            ->assertStatus(422);
    }

    public function test_applicant_payload_carries_availability_flags(): void
    {
        $category = $this->category();
        $owner = $this->actingAsUser();
        $request = $this->pendingRequest($owner, $category);

        $provider = $this->actingAsUser();
        $this->approvedProfile($provider, $category);

        $this->actingAs($provider, 'sanctum')
            ->postJson("/api/need-requests/{$request->id}/offers", [
                'price' => 400,
                'message' => 'Available this week.',
            ])
            ->assertStatus(201);

        // Pausing after offering is reflected on the applicant row.
        $this->actingAs($provider, 'sanctum')
            ->postJson('/api/provider-profile/availability', ['is_available' => false])
            ->assertOk();

        $detail = $this->actingAs($owner, 'sanctum')
            ->getJson("/api/need-requests/{$request->id}")
            ->assertOk()
            ->json('data.offers.0');
        $this->assertFalse($detail['provider_is_available']);
        $this->assertSame(NeedProviderProfile::STATUS_APPROVED, $detail['provider_profile_status']);

        $list = $this->actingAs($owner, 'sanctum')
            ->getJson("/api/need-requests/{$request->id}/offers")
            ->assertOk()
            ->json('data.0');
        $this->assertFalse($list['provider_is_available']);
        $this->assertSame(NeedProviderProfile::STATUS_APPROVED, $list['provider_profile_status']);
    }
}
