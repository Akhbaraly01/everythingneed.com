<?php

namespace Tests\Feature\Healthcare;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Healthcare\Entities\AidDonation;
use Modules\Healthcare\Entities\AidRequest;
use Tests\TestCase;

/**
 * Phase 5: donor unlinkability. Anonymous donations hide the donor from the
 * public detail while the donor, the request owner, and moderation staff
 * still resolve names (receipts, refunds, fraud review).
 */
class AidAnonymityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['payments.driver' => 'mock']);
    }

    private function approvedAid(): AidRequest
    {
        return AidRequest::create([
            'user_id' => $this->createUser()->id,
            'title' => 'Surgery fund',
            'description' => 'Knee surgery.',
            'category' => 'medical',
            'goal_amount' => 5000,
            'currency' => 'USD',
            'status' => AidRequest::STATUS_APPROVED,
        ]);
    }

    private function donateAnonymously(string $aidId, bool $anonymous = true): void
    {
        $this->postJson("/api/health/aid/{$aidId}/donate", [
            'amount' => 50,
            'method' => 'card',
            'anonymous' => $anonymous,
        ])->assertCreated();
    }

    public function test_named_donation_exposes_donor_publicly(): void
    {
        $aid = $this->approvedAid();
        $donor = $this->actingAsUser();
        $this->donateAnonymously($aid->id, false);

        $row = AidDonation::first();
        $this->assertFalse((bool) $row->is_anonymous);

        $stranger = $this->createUser();
        $res = $this->actingAs($stranger, 'sanctum')->getJson("/api/health/aid/{$aid->id}");
        $res->assertOk();
        $donations = $res->json('data.donations');
        $this->assertNotEmpty($donations);
        $this->assertSame($donor->name, $donations[0]['donor']['name'] ?? null);
    }

    public function test_anonymous_donation_hides_donor_from_public(): void
    {
        $aid = $this->approvedAid();
        $donor = $this->actingAsUser();
        $this->donateAnonymously($aid->id, true);

        $this->assertTrue((bool) AidDonation::first()->is_anonymous);

        // Stranger: no donor identity.
        $stranger = $this->createUser();
        $res = $this->actingAs($stranger, 'sanctum')->getJson("/api/health/aid/{$aid->id}");
        $res->assertOk();
        $donations = $res->json('data.donations');
        $this->assertNotEmpty($donations);
        $this->assertNull($donations[0]['donor'] ?? null);

        // Donor themselves still resolve.
        $mine = $this->actingAs($donor, 'sanctum')->getJson("/api/health/aid/{$aid->id}");
        $mine->assertOk();
        $this->assertSame($donor->name, $mine->json('data.donations.0.donor.name'));

        // Request owner still resolves.
        $owner = \App\Models\User::find($aid->user_id);
        $owned = $this->actingAs($owner, 'sanctum')->getJson("/api/health/aid/{$aid->id}");
        $owned->assertOk();
        $this->assertSame($donor->name, $owned->json('data.donations.0.donor.name'));
    }
}
