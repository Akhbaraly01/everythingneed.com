<?php

namespace Tests\Feature\Healthcare;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Healthcare\Entities\AidDonation;
use Modules\Healthcare\Entities\AidRequest;
use Modules\Payments\Entities\Payment;
use Tests\TestCase;
use Database\Seeders\PermissionSeeder;

/**
 * H-C: Healthcare Aid / Charity - requesters file requests (pending),
 * support reviews them (approved/rejected) and donors fund approved
 * requests through the same idempotent PaymentService used elsewhere.
 * Money never moves at request time - only at donation.
 */
class AidDomainTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['payments.driver' => 'mock']);
    }

    private function makeAid(array $attributes = []): AidRequest
    {
        static $i = 0;
        $i++;

        return AidRequest::create(array_merge([
            'user_id' => $this->createUser()->id,
            'title' => "Aid request {$i}",
            'description' => 'A real medical need in the community.',
            'category' => 'medical',
            'goal_amount' => 500,
            'currency' => 'USD',
            'status' => AidRequest::STATUS_PENDING,
        ], $attributes));
    }

    public function test_requester_files_a_pending_request_and_money_never_moves(): void
    {
        $user = $this->actingAsUser();

        $res = $this->postJson('/api/health/aid', [
            'title' => 'Dialysis support',
            'description' => 'Three sessions a week for a month.',
            'category' => 'medical',
            'goal_amount' => 1200,
        ]);

        $res->assertCreated()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.user_id', $user->id);

        $this->assertSame(0, Payment::where('user_id', $user->id)->count());
    }

    public function test_request_is_idempotent_by_key(): void
    {
        $this->actingAsUser();

        $first = $this->postJson('/api/health/aid', [
            'title' => 'Insulin',
            'description' => 'Three months of insulin and strips.',
            'goal_amount' => 300,
            'idempotency_key' => 'aid-key-1',
        ]);
        $second = $this->postJson('/api/health/aid', [
            'title' => 'Insulin',
            'description' => 'Three months of insulin and strips.',
            'goal_amount' => 300,
            'idempotency_key' => 'aid-key-1',
        ]);

        $first->assertCreated();
        $second->assertCreated();
        $this->assertSame($first->json('data.id'), $second->json('data.id'));
        $this->assertSame(1, AidRequest::where('idempotency_key', 'aid-key-1')->count());
    }

    public function test_public_listing_shows_only_approved_and_funded(): void
    {
        $this->makeAid(['title' => 'Approved one', 'status' => AidRequest::STATUS_APPROVED]);
        $this->makeAid(['title' => 'Funded one', 'status' => AidRequest::STATUS_FUNDED]);
        $this->makeAid(['title' => 'Pending one', 'status' => AidRequest::STATUS_PENDING]);
        $this->makeAid(['title' => 'Rejected one', 'status' => AidRequest::STATUS_REJECTED]);

        $res = $this->getJson('/api/health/aid');
        $res->assertOk();
        $titles = collect($res->json('data'))->pluck('title')->all();
        $this->assertContains('Approved one', $titles);
        $this->assertContains('Funded one', $titles);
        $this->assertNotContains('Pending one', $titles);
        $this->assertNotContains('Rejected one', $titles);
    }

    public function test_detail_hides_pending_from_strangers_but_shows_owner(): void
    {
        $owner = $this->createUser();
        $aid = $this->makeAid(['user_id' => $owner->id, 'status' => AidRequest::STATUS_PENDING]);

        $this->getJson("/api/health/aid/{$aid->id}")->assertNotFound();

        $this->actingAs($owner, 'sanctum')
            ->getJson("/api/health/aid/{$aid->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $aid->id);
    }

    public function test_support_approving_a_request_makes_it_public(): void
    {

        $this->seed(PermissionSeeder::class);        $aid = $this->makeAid();
        $admin = $this->actingAsUser('healthcare_admin');

        $this->putJson("/api/admin/healthcare/aid/{$aid->id}", ['action' => 'approve'])
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');

        $aid->refresh();
        $this->assertSame(AidRequest::STATUS_APPROVED, $aid->status);
        $this->assertSame($admin->id, $aid->reviewed_by);
        $this->assertNotNull($aid->reviewed_at);

        $this->getJson('/api/health/aid')->assertOk();
        $this->assertSame($aid->id, $this->getJson('/api/health/aid')->json('data.0.id'));
    }

    public function test_support_rejecting_records_reason_and_stays_private(): void
    {

        $this->seed(PermissionSeeder::class);        $aid = $this->makeAid();
        $this->actingAsUser('healthcare_admin');

        $this->putJson("/api/admin/healthcare/aid/{$aid->id}", [
            'action' => 'reject',
            'reason' => 'Need a letter from the facility.',
        ])
            ->assertOk()
            ->assertJsonPath('data.status', 'rejected');

        $aid->refresh();
        $this->assertSame('Need a letter from the facility.', $aid->rejection_reason);
        $this->getJson("/api/health/aid/{$aid->id}")->assertNotFound();
    }

    public function test_reviewing_twice_is_422_and_never_double_decides(): void
    {

        $this->seed(PermissionSeeder::class);        $aid = $this->makeAid();
        $this->actingAsUser('healthcare_admin');

        $this->putJson("/api/admin/healthcare/aid/{$aid->id}", ['action' => 'approve'])->assertOk();
        $this->putJson("/api/admin/healthcare/aid/{$aid->id}", ['action' => 'reject'])->assertStatus(422);

        $this->assertSame(AidRequest::STATUS_APPROVED, $aid->fresh()->status);
    }

    public function test_customer_cannot_use_the_admin_review_endpoint(): void
    {
        $aid = $this->makeAid();
        $this->actingAsUser();

        $this->putJson("/api/admin/healthcare/aid/{$aid->id}", ['action' => 'approve'])->assertForbidden();
    }

    public function test_donor_charges_payment_and_request_progress_updates(): void
    {
        $aid = $this->makeAid(['status' => AidRequest::STATUS_APPROVED, 'goal_amount' => 500]);
        $donor = $this->createUser();
        $this->actingAs($donor, 'sanctum');

        $res = $this->postJson("/api/health/aid/{$aid->id}/donate", [
            'amount' => 150,
            'method' => 'card',
        ]);

        $res->assertCreated()
            ->assertJsonPath('data.status', 'completed');
        $this->assertEquals(150.0, (float) $res->json('data.amount'));

        $aid->refresh();
        $this->assertEquals(150.0, (float) $aid->raised_amount);
        $this->assertSame(AidRequest::STATUS_APPROVED, $aid->status);

        $payment = Payment::where('user_id', $donor->id)->first();
        $this->assertNotNull($payment);
        $this->assertSame('aid_donation', $payment->purpose);
        $this->assertSame('aid-'.$aid->id.'-'.$donor->id, $payment->idempotency_key);
    }

    public function test_donor_cannot_donate_twice(): void
    {
        $aid = $this->makeAid(['status' => AidRequest::STATUS_APPROVED]);
        $this->actingAsUser();

        $this->postJson("/api/health/aid/{$aid->id}/donate", ['amount' => 50, 'method' => 'card'])->assertCreated();
        $this->postJson("/api/health/aid/{$aid->id}/donate", ['amount' => 50, 'method' => 'card'])->assertStatus(422);

        $this->assertSame(1, AidDonation::where('aid_request_id', $aid->id)->count());
    }

    public function test_cannot_donate_to_pending_or_own_request(): void
    {
        $pending = $this->makeAid(['status' => AidRequest::STATUS_PENDING]);
        $this->actingAsUser();
        $this->postJson("/api/health/aid/{$pending->id}/donate", ['amount' => 50, 'method' => 'card'])->assertStatus(422);

        $own = $this->makeAid(['user_id' => auth()->id(), 'status' => AidRequest::STATUS_APPROVED]);
        $this->postJson("/api/health/aid/{$own->id}/donate", ['amount' => 50, 'method' => 'card'])->assertStatus(422);
    }

    public function test_reaching_the_goal_marks_the_request_funded(): void
    {
        $aid = $this->makeAid(['status' => AidRequest::STATUS_APPROVED, 'goal_amount' => 100]);
        $this->actingAsUser();

        $this->postJson("/api/health/aid/{$aid->id}/donate", ['amount' => 100, 'method' => 'card'])->assertCreated();

        $this->assertSame(AidRequest::STATUS_FUNDED, $aid->fresh()->status);
    }

    public function test_requester_sees_own_requests_and_donor_sees_own_donations(): void
    {
        $requester = $this->createUser();
        $aid = $this->makeAid(['user_id' => $requester->id, 'status' => AidRequest::STATUS_APPROVED]);

        $donor = $this->createUser();
        $this->actingAs($donor, 'sanctum');
        $this->postJson("/api/health/aid/{$aid->id}/donate", ['amount' => 75, 'method' => 'card'])->assertCreated();

        // Requester's list.
        $this->actingAs($requester, 'sanctum');
        $mine = $this->getJson('/api/health/aid/mine');
        $mine->assertOk();
        $this->assertSame($aid->id, $mine->json('data.0.id'));

        // Donor's donations.
        $this->actingAs($donor, 'sanctum');
        $donations = $this->getJson('/api/health/aid/donations');
        $donations->assertOk();
        $this->assertEquals(75.0, (float) $donations->json('data.0.amount'));
        $this->assertSame($aid->id, $donations->json('data.0.aid_request.id'));
    }

    public function test_guest_cannot_file_or_donate(): void
    {
        $aid = $this->makeAid(['status' => AidRequest::STATUS_APPROVED]);

        $this->postJson('/api/health/aid', ['title' => 'x', 'description' => 'y', 'goal_amount' => 10])->assertUnauthorized();
        $this->postJson("/api/health/aid/{$aid->id}/donate", ['amount' => 10, 'method' => 'card'])->assertUnauthorized();
    }
}
