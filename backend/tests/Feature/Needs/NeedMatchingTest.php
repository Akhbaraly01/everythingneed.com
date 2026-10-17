<?php

namespace Tests\Feature\Needs;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Modules\Needs\Entities\NeedCategory;
use Modules\Needs\Entities\NeedProviderProfile;
use Modules\Needs\Entities\NeedRequest;
use Tests\TestCase;

/**
 * TODO 11 matching: eligibility-first, explainable, never fabricated.
 */
class NeedMatchingTest extends TestCase
{
    private function category(bool $verified = false): NeedCategory
    {
        return NeedCategory::create([
            'name' => 'Cleaning',
            'slug' => 'cleaning-' . uniqid(),
            'icon' => 'sparkles',
            'color' => '#10B981',
            'requires_verified_provider' => $verified,
        ]);
    }

    private function verifyKyc(object $user): void
    {
        DB::table('kyc_verifications')->insert([
            'id' => (string) Str::uuid(),
            'user_id' => $user->id,
            'status' => 'approved',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function approvedProfile(object $user, ?NeedCategory $category = null, array $areas = []): NeedProviderProfile
    {
        return NeedProviderProfile::create([
            'user_id' => $user->id,
            'display_name' => 'Pro ' . substr((string) Str::uuid(), 0, 8),
            'category_ids' => $category ? [$category->id] : [],
            'service_areas' => $areas,
            'status' => NeedProviderProfile::STATUS_APPROVED,
        ]);
    }

    private function openRequest(object $owner, NeedCategory $category, array $over = []): NeedRequest
    {
        return NeedRequest::create(array_merge([
            'user_id' => $owner->id,
            'category_id' => $category->id,
            'request_number' => 'NR-' . strtoupper(uniqid()),
            'title' => 'Clean my flat',
            'description' => 'Two-bed flat.',
            'status' => NeedRequest::STATUS_PUBLISHED,
            'state' => 'Lagos',
            'lga' => 'Ikeja',
        ], $over));
    }

    public function test_owner_sees_ranked_matches_with_reasons(): void
    {
        $category = $this->category();
        $owner = $this->actingAsUser();

        $local = $this->actingAsUser();
        $this->approvedProfile($local, $category, [['state' => 'Lagos', 'lga' => 'Ikeja']]);
        $this->verifyKyc($local);

        $far = $this->actingAsUser();
        $this->approvedProfile($far, $category, [['state' => 'Abuja']]);

        $request = $this->openRequest($owner, $category);

        $this->actingAs($owner, 'sanctum');
        $res = $this->getJson("/api/need-requests/{$request->id}/matches")->assertOk();
        $matches = $res->json('data.matches');

        $this->assertCount(2, $matches);
        // Local + verified outranks distant + unverified.
        $this->assertEquals((string) $local->id, $matches[0]['user_id']);
        $this->assertContains('serves this category', $matches[0]['reasons']);
        $this->assertContains('serves your state', $matches[0]['reasons']);
        $this->assertContains('verified identity', $matches[0]['reasons']);
        $this->assertEquals(2, $res->json('data.eligible_count'));
    }

    public function test_stranger_cannot_view_matches(): void
    {
        $category = $this->category();
        $owner = $this->actingAsUser();
        $request = $this->openRequest($owner, $category);

        $this->actingAsUser();
        $this->getJson("/api/need-requests/{$request->id}/matches")->assertStatus(403);
    }

    public function test_suspended_and_owner_never_match(): void
    {
        $category = $this->category();
        $owner = $this->actingAsUser();
        $this->approvedProfile($owner, $category);

        $suspended = $this->actingAsUser();
        NeedProviderProfile::create([
            'user_id' => $suspended->id,
            'display_name' => 'Bad actor',
            'status' => NeedProviderProfile::STATUS_SUSPENDED,
        ]);

        $request = $this->openRequest($owner, $category);

        $this->actingAs($owner, 'sanctum');
        $res = $this->getJson("/api/need-requests/{$request->id}/matches")->assertOk();
        $this->assertEquals([], $res->json('data.matches'));
        $this->assertEquals(0, $res->json('data.eligible_count'));
    }

    public function test_trial_provider_never_matches(): void
    {
        // N-23: trial is a watched stage, not a badge — auto-matching only
        // surfaces approved providers.
        $category = $this->category();
        $owner = $this->actingAsUser();

        $trial = $this->actingAsUser();
        NeedProviderProfile::create([
            'user_id' => $trial->id,
            'display_name' => 'On Trial',
            'category_ids' => [$category->id],
            'status' => NeedProviderProfile::STATUS_TRIAL,
            'trial_started_at' => now(),
        ]);

        $request = $this->openRequest($owner, $category);

        $this->actingAs($owner, 'sanctum');
        $res = $this->getJson("/api/need-requests/{$request->id}/matches")->assertOk();
        $ids = array_column($res->json('data.matches'), 'user_id');
        $this->assertNotContains((string) $trial->id, $ids);
        $this->assertEquals(0, $res->json('data.eligible_count'));
    }

    public function test_verified_category_admits_only_vetted(): void
    {
        $category = $this->category(true);
        $owner = $this->actingAsUser();

        $plain = $this->actingAsUser();
        $this->approvedProfile($plain, $category);

        $vetted = $this->actingAsUser();
        $this->approvedProfile($vetted, $category);
        $this->verifyKyc($vetted);

        $request = $this->openRequest($owner, $category);

        $this->actingAs($owner, 'sanctum');
        $res = $this->getJson("/api/need-requests/{$request->id}/matches")->assertOk();
        $ids = array_column($res->json('data.matches'), 'user_id');

        $this->assertContains((string) $vetted->id, $ids);
        $this->assertNotContains((string) $plain->id, $ids);
    }

    public function test_invite_only_matches_only_invitees(): void
    {
        $category = $this->category();
        $owner = $this->actingAsUser();

        $invited = $this->actingAsUser();
        $outsider = $this->actingAsUser();
        $this->approvedProfile($outsider, $category);

        $request = $this->openRequest($owner, $category, [
            'visibility' => NeedRequest::VISIBILITY_INVITE_ONLY,
            'invited_provider_ids' => [$invited->id],
        ]);

        $this->actingAs($owner, 'sanctum');
        $res = $this->getJson("/api/need-requests/{$request->id}/matches")->assertOk();
        $matches = $res->json('data.matches');

        $this->assertCount(1, $matches);
        $this->assertEquals((string) $invited->id, $matches[0]['user_id']);
        $this->assertContains('invited by the request owner', $matches[0]['reasons']);
    }

    public function test_provider_side_annotates_eligibility(): void
    {
        $category = $this->category(true);
        $owner = $this->actingAsUser();
        $request = $this->openRequest($owner, $category);

        $provider = $this->actingAsUser();
        $res = $this->getJson('/api/provider-matches')->assertOk();
        $row = collect($res->json('data'))->firstWhere('id', $request->id);

        $this->assertNotNull($row);
        $this->assertFalse($row['eligible']);
        $this->assertContains('requires_verified_provider', $row['reasons']);

        $this->approvedProfile($provider, $category);
        $this->verifyKyc($provider);
        $res = $this->getJson('/api/provider-matches')->assertOk();
        $row = collect($res->json('data'))->firstWhere('id', $request->id);
        $this->assertTrue($row['eligible']);
    }

    public function test_review_rating_signal_ranks_reviewed_provider_higher(): void
    {
        $category = $this->category();
        $owner = $this->actingAsUser();

        // Both providers: same category, no areas, no KYC — the only
        // difference is that one has approved 5-star reviews.
        $plain = $this->actingAsUser();
        $this->approvedProfile($plain, $category);

        $reviewed = $this->actingAsUser();
        $this->approvedProfile($reviewed, $category);

        // Seed a completed request + accepted offer + approved review so
        // the rating map credits the reviewed provider.
        $pastOwner = $this->actingAsUser();
        $past = $this->openRequest($pastOwner, $category, ['status' => NeedRequest::STATUS_COMPLETED]);
        DB::table('need_offers')->insert([
            'id' => (string) Str::uuid(),
            'need_request_id' => $past->id,
            'provider_id' => $reviewed->id,
            'price' => 100,
            'status' => 'accepted',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('reviews')->insert([
            'id' => (string) Str::uuid(),
            'user_id' => $pastOwner->id,
            'reviewable_type' => 'need_request',
            'reviewable_id' => $past->id,
            'rating' => 5,
            'status' => 'approved',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $request = $this->openRequest($owner, $category);
        $this->actingAs($owner, 'sanctum');
        $res = $this->getJson("/api/need-requests/{$request->id}/matches")->assertOk();
        $matches = $res->json('data.matches');

        $this->assertCount(2, $matches);
        $this->assertEquals((string) $reviewed->id, $matches[0]['user_id']);
        $this->assertContains('5.0 average from 1 client review(s)', $matches[0]['reasons']);
        $this->assertGreaterThan($matches[1]['score'], $matches[0]['score']);
    }

    public function test_hidden_review_does_not_boost_matching(): void
    {
        $category = $this->category();
        $owner = $this->actingAsUser();

        $provider = $this->actingAsUser();
        $this->approvedProfile($provider, $category);

        $pastOwner = $this->actingAsUser();
        $past = $this->openRequest($pastOwner, $category, ['status' => NeedRequest::STATUS_COMPLETED]);
        DB::table('need_offers')->insert([
            'id' => (string) Str::uuid(),
            'need_request_id' => $past->id,
            'provider_id' => $provider->id,
            'price' => 100,
            'status' => 'accepted',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('reviews')->insert([
            'id' => (string) Str::uuid(),
            'user_id' => $pastOwner->id,
            'reviewable_type' => 'need_request',
            'reviewable_id' => $past->id,
            'rating' => 1,
            'status' => 'hidden',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $request = $this->openRequest($owner, $category);
        $this->actingAs($owner, 'sanctum');
        $matches = $this->getJson("/api/need-requests/{$request->id}/matches")
            ->assertOk()
            ->json('data.matches');

        $this->assertCount(1, $matches);
        foreach ($matches[0]['reasons'] as $reason) {
            $this->assertStringNotContainsString('average from', $reason);
        }
    }
}
