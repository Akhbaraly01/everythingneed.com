<?php

namespace Tests\Feature\Needs;

use Illuminate\Support\Facades\DB;
use Modules\Needs\Entities\NeedCategory;
use Modules\Needs\Entities\NeedProviderProfile;
use Modules\Needs\Entities\NeedRequest;
use Tests\TestCase;

/**
 * TODO 08 provider onboarding + verification: profile lifecycle, review
 * decisions, suspension, and category-gated offer eligibility.
 */
class NeedProviderVerificationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\PermissionSeeder::class);
    }

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
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => $user->id,
            'status' => 'approved',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function submitProfile(object $user, NeedCategory $category): string
    {
        $this->actingAs($user, 'sanctum');

        return $this->postJson('/api/provider-profile', [
            'display_name' => 'Jane the Plumber',
            'bio' => 'Ten years fixing leaks.',
            'category_ids' => [$category->id],
            'service_areas' => [['state' => 'Lagos', 'lga' => 'Ikeja']],
            'qualifications' => ['Trade Test II'],
            'submit' => true,
        ])->assertStatus(201)->json('data.id');
    }

    public function test_profile_draft_submit_and_resubmit_flow(): void
    {
        $category = $this->category();
        $user = $this->actingAsUser();

        $draft = $this->postJson('/api/provider-profile', [
            'display_name' => 'Jane',
        ])->assertStatus(201);
        $this->assertEquals('draft', $draft->json('data.status'));

        // Submit without a category is refused.
        $this->postJson('/api/provider-profile', [
            'display_name' => 'Jane the Plumber',
            'submit' => true,
        ])->assertStatus(422);

        $this->getJson('/api/provider-profile')->assertOk()
            ->assertJsonFragment(['display_name' => 'Jane']);
    }

    public function test_admin_approve_reject_and_re_review(): void
    {
        $category = $this->category();
        $provider = $this->actingAsUser();
        $profileId = $this->submitProfile($provider, $category);

        $this->actingAsUser('needs_admin');

        // Reject demands a reason.
        $this->postJson("/api/admin/needs/providers/{$profileId}/review", [
            'decision' => 'reject',
        ])->assertStatus(422);

        $this->postJson("/api/admin/needs/providers/{$profileId}/review", [
            'decision' => 'reject',
            'note' => 'Evidence unreadable, please re-upload.',
        ])->assertOk();
        $this->assertEquals('rejected', NeedProviderProfile::find($profileId)->status);

        // Provider revises and resubmits; reviewer approves.
        $this->actingAs($provider, 'sanctum');
        $this->postJson('/api/provider-profile', [
            'display_name' => 'Jane the Plumber',
            'category_ids' => [$category->id],
            'evidence_urls' => ['https://example.com/cert.pdf'],
            'submit' => true,
        ])->assertStatus(200);

        $this->actingAsUser('needs_admin');
        $this->postJson("/api/admin/needs/providers/{$profileId}/review", [
            'decision' => 'approve',
        ])->assertOk();
        $profile = NeedProviderProfile::find($profileId);
        $this->assertEquals('approved', $profile->status);
        $this->assertNotNull($profile->reviewed_by);

        // Editing an approved profile returns it to review.
        $this->actingAs($provider, 'sanctum');
        $this->postJson('/api/provider-profile', [
            'display_name' => 'Jane the Plumber Co.',
            'category_ids' => [$category->id],
            'submit' => true,
        ])->assertStatus(200);
        $this->assertEquals('submitted', NeedProviderProfile::find($profileId)->status);
    }

    public function test_customer_cannot_review_profiles(): void
    {
        $category = $this->category();
        $provider = $this->actingAsUser();
        $profileId = $this->submitProfile($provider, $category);

        $this->actingAsUser();
        $this->postJson("/api/admin/needs/providers/{$profileId}/review", [
            'decision' => 'approve',
        ])->assertStatus(403);
    }

    public function test_trial_stage_funnel_screening_to_verified(): void
    {
        $category = $this->category(true);
        $provider = $this->actingAsUser();
        $profileId = $this->submitProfile($provider, $category);

        // Screening hands the provider a trial window, not approval.
        $this->actingAsUser('needs_admin');
        $this->postJson("/api/admin/needs/providers/{$profileId}/review", [
            'decision' => 'trial',
            'note' => 'Looks promising; watch first few jobs.',
        ])->assertOk();

        $profile = NeedProviderProfile::find($profileId);
        $this->assertEquals('trial', $profile->status);
        $this->assertNotNull($profile->trial_started_at);

        // The provider hears about the stage.
        $this->assertDatabaseHas('notifications', [
            'user_id' => $provider->id,
            'type' => 'provider_profile_review',
        ]);

        // Double-starting a trial is refused.
        $this->postJson("/api/admin/needs/providers/{$profileId}/review", [
            'decision' => 'trial',
        ])->assertStatus(422);

        // Rejecting out of trial still demands a reason.
        $this->postJson("/api/admin/needs/providers/{$profileId}/review", [
            'decision' => 'reject',
        ])->assertStatus(422);

        // Trial → approved completes the funnel.
        $this->postJson("/api/admin/needs/providers/{$profileId}/review", [
            'decision' => 'approve',
        ])->assertOk();
        $this->assertEquals('approved', NeedProviderProfile::find($profileId)->status);

        // Editing an approved profile returns it to screening and clears
        // the trial clock.
        $this->actingAs($provider, 'sanctum');
        $this->postJson('/api/provider-profile', [
            'display_name' => 'Jane the Plumber',
            'category_ids' => [$category->id],
            'submit' => true,
        ])->assertStatus(200);
        $profile = NeedProviderProfile::find($profileId);
        $this->assertEquals('submitted', $profile->status);
        $this->assertNull($profile->trial_started_at);
    }

    public function test_trial_provider_offer_boundaries(): void
    {
        $verified = $this->category(true);
        $plain = $this->category(false);

        $owner = $this->actingAsUser();
        $verifiedRequest = $this->postJson('/api/need-requests', [
            'title' => 'Rewire a kitchen',
            'description' => 'Full rewire.',
            'category_id' => $verified->id,
            'pricing_basis' => 'quote',
        ])->assertStatus(201)->json('data.id');

        $plainRequest = $this->postJson('/api/need-requests', [
            'title' => 'Assemble a shelf',
            'description' => 'One shelf.',
            'category_id' => $plain->id,
            'pricing_basis' => 'quote',
        ])->assertStatus(201)->json('data.id');

        $provider = $this->actingAsUser();
        $profileId = $this->submitProfile($provider, $plain);

        $this->actingAsUser('needs_admin');
        $this->postJson("/api/admin/needs/providers/{$profileId}/review", [
            'decision' => 'trial',
        ])->assertOk();

        // Trial is not verified: verified categories stay closed.
        $this->actingAs($provider, 'sanctum');
        $this->postJson("/api/need-requests/{$verifiedRequest}/offers", [
            'price' => 500,
            'message' => 'Still on trial.',
        ])->assertStatus(403);

        // Trial may work on non-verified categories while observed.
        $this->postJson("/api/need-requests/{$plainRequest}/offers", [
            'price' => 40,
            'message' => 'Happy to help.',
        ])->assertStatus(201);

        // Suspended profiles are barred even from trial-stage re-entry:
        // suspension from trial is a hard block on offering anywhere.
        $this->actingAsUser('needs_admin');
        $this->postJson("/api/admin/needs/providers/{$profileId}/suspend", [
            'note' => 'Trial terms breached.',
        ])->assertOk();
        $this->actingAs($provider, 'sanctum');
        $this->postJson("/api/need-requests/{$plainRequest}/offers", [
            'price' => 41,
            'message' => 'Trying after suspension.',
        ])->assertStatus(403);
    }

    public function test_verified_category_blocks_unvetted_providers(): void
    {
        $category = $this->category(true);
        $owner = $this->actingAsUser();

        $requestId = $this->postJson('/api/need-requests', [
            'title' => 'Rewire a shop',
            'description' => 'Full shop rewiring.',
            'category_id' => $category->id,
            'pricing_basis' => 'quote',
        ])->assertStatus(201)->json('data.id');

        // No profile at all: blocked.
        $stranger = $this->actingAsUser();
        $this->postJson("/api/need-requests/{$requestId}/offers", [
            'price' => 500,
            'message' => 'I can do it.',
        ])->assertStatus(403);

        // Approved profile but unverified identity: still blocked.
        $provider = $this->actingAsUser();
        $profileId = $this->submitProfile($provider, $category);
        $this->actingAsUser('needs_admin');
        $this->postJson("/api/admin/needs/providers/{$profileId}/review", [
            'decision' => 'approve',
        ])->assertOk();

        $this->actingAs($provider, 'sanctum');
        $this->postJson("/api/need-requests/{$requestId}/offers", [
            'price' => 500,
            'message' => 'I can do it.',
        ])->assertStatus(403);

        // Verified identity completes eligibility: offer accepted.
        $this->verifyKyc($provider);
        $this->postJson("/api/need-requests/{$requestId}/offers", [
            'price' => 500,
            'message' => 'Licensed and verified.',
        ])->assertStatus(201);
    }

    public function test_suspended_provider_cannot_offer_anywhere(): void
    {
        $plain = $this->category(false);
        $owner = $this->actingAsUser();

        $requestId = $this->postJson('/api/need-requests', [
            'title' => 'Mow the lawn',
            'description' => 'Quarterly mowing.',
            'category_id' => $plain->id,
            'pricing_basis' => 'quote',
        ])->assertStatus(201)->json('data.id');

        $provider = $this->actingAsUser();
        $profileId = $this->submitProfile($provider, $plain);

        $this->actingAsUser('needs_admin');
        $this->postJson("/api/admin/needs/providers/{$profileId}/review", [
            'decision' => 'approve',
        ])->assertOk();
        $this->postJson("/api/admin/needs/providers/{$profileId}/suspend", [
            'note' => 'Fake reviews detected.',
        ])->assertOk();

        $this->actingAs($provider, 'sanctum');
        $this->postJson("/api/need-requests/{$requestId}/offers", [
            'price' => 50,
            'message' => 'Trying anyway.',
        ])->assertStatus(403);

        // Reinstatement returns the profile to the review queue, not approval.
        $this->actingAsUser('needs_admin');
        $this->postJson("/api/admin/needs/providers/{$profileId}/reinstate")->assertOk();
        $this->assertEquals('submitted', NeedProviderProfile::find($profileId)->status);
    }
}
