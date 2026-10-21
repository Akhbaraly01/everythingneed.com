<?php

namespace Tests\Feature\Needs;

use Modules\Needs\Entities\NeedCategory;
use Modules\Needs\Entities\NeedOffer;
use Modules\Needs\Entities\NeedRequest;
use Modules\Needs\Entities\NeedTimesheet;
use Modules\Payments\Entities\Payment;
use Tests\TestCase;

/**
 * N-25 hourly timesheet ledger.
 *
 * The provider logs the hours, the owner approves them and the payout is
 * computed from the approved hours. A replay can never bill twice.
 */
class NeedTimesheetTest extends TestCase
{
    private function hourlyRequest(float $rate = 40.0): array
    {
        $category = NeedCategory::create([
            'name' => 'Tutoring',
            'slug' => 'tutoring-'.uniqid(),
            'icon' => 'graduation-cap',
            'color' => '#3B82F6',
        ]);

        $owner = $this->createUser();
        $provider = $this->createUser();

        $request = NeedRequest::create([
            'user_id' => $owner->id,
            'category_id' => $category->id,
            'request_number' => 'NR-'.strtoupper(uniqid()),
            'title' => 'Math tutoring, hourly',
            'description' => 'Two hours of algebra support.',
            'status' => NeedRequest::STATUS_IN_PROGRESS,
            'pricing_basis' => NeedRequest::PRICING_HOURLY,
            'currency' => 'USD',
        ]);

        $offer = NeedOffer::create([
            'need_request_id' => $request->id,
            'provider_id' => $provider->id,
            'price' => $rate,
            'message' => 'Available evenings.',
            'status' => NeedOffer::STATUS_ACCEPTED,
        ]);

        return [$request, $offer, $owner, $provider];
    }

    public function test_the_provider_logs_hours_and_the_owner_approves_them(): void
    {
        [$request, , $owner, $provider] = $this->hourlyRequest(40.0);

        $this->actingAs($provider, 'sanctum');
        $this->postJson("/api/need-requests/{$request->id}/timesheets", [
            'work_date' => '2026-10-21',
            'minutes' => 90,
            'note' => 'Algebra plus homework help.',
        ])
            ->assertStatus(201)
            ->assertJsonPath('data.minutes', 90)
            ->assertJsonPath('data.status', 'submitted');

        $this->assertEquals(60.0, (float) NeedTimesheet::where('need_request_id', $request->id)->value('amount'));

        $this->assertDatabaseHas('need_timesheets', [
            'need_request_id' => $request->id,
            'provider_id' => $provider->id,
            'minutes' => 90,
            'amount' => 60.0,
            'status' => 'submitted',
        ]);

        // The owner is told, and the provider cannot approve their own hours.
        $this->assertDatabaseHas('notifications', [
            'user_id' => $owner->id,
            'type' => 'need_timesheet_submitted',
        ]);

        $entryId = NeedTimesheet::where('need_request_id', $request->id)->value('id');
        $this->postJson("/api/need-requests/{$request->id}/timesheets/{$entryId}/approve")->assertStatus(403);

        $this->actingAs($owner, 'sanctum');
        $this->postJson("/api/need-requests/{$request->id}/timesheets/{$entryId}/approve")
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');
    }

    public function test_paying_approved_hours_credits_the_provider_once(): void
    {
        config(['payments.driver' => 'mock']);
        [$request, , $owner, $provider] = $this->hourlyRequest(40.0);

        $this->actingAs($provider, 'sanctum');
        $entryId = $this->postJson("/api/need-requests/{$request->id}/timesheets", [
            'work_date' => '2026-10-21',
            'minutes' => 90,
        ])->assertStatus(201)->json('data.id');

        $this->actingAs($owner, 'sanctum');
        $this->postJson("/api/need-requests/{$request->id}/timesheets/{$entryId}/approve")->assertOk();

        $this->postJson("/api/need-requests/{$request->id}/timesheets/pay")
            ->assertOk()
            ->assertJsonCount(1, 'data.paid');

        $payout = Payment::where('order_id', $request->id)
            ->where('purpose', 'need_timesheet_payout')
            ->first();
        $this->assertNotNull($payout);
        $this->assertEquals(60.0, (float) $payout->amount);
        $this->assertEquals((string) $provider->id, (string) $payout->user_id);
        $this->assertEquals('paid', NeedTimesheet::find($entryId)->status);

        // A replayed payout has nothing left to pay.
        $this->postJson("/api/need-requests/{$request->id}/timesheets/pay")->assertStatus(422);
        $this->assertEquals(
            1,
            Payment::where('order_id', $request->id)->where('purpose', 'need_timesheet_payout')->count()
        );
    }

    public function test_only_the_accepted_provider_can_log_time(): void
    {
        [$request, , $owner] = $this->hourlyRequest(40.0);

        $this->actingAs($owner, 'sanctum');
        $this->postJson("/api/need-requests/{$request->id}/timesheets", [
            'work_date' => '2026-10-21',
            'minutes' => 60,
        ])->assertStatus(403);

        $this->actingAsUser();
        $this->postJson("/api/need-requests/{$request->id}/timesheets", [
            'work_date' => '2026-10-21',
            'minutes' => 60,
        ])->assertStatus(403);
    }

    public function test_one_entry_per_provider_per_day(): void
    {
        [$request, , , $provider] = $this->hourlyRequest(40.0);

        $this->actingAs($provider, 'sanctum');
        $this->postJson("/api/need-requests/{$request->id}/timesheets", [
            'work_date' => '2026-10-21',
            'minutes' => 60,
        ])->assertStatus(201);

        // The same day is never billed twice.
        $this->postJson("/api/need-requests/{$request->id}/timesheets", [
            'work_date' => '2026-10-21',
            'minutes' => 120,
        ])->assertOk()->assertJsonPath('data.minutes', 60);

        $this->assertEquals(1, NeedTimesheet::where('need_request_id', $request->id)->count());
    }

    public function test_the_owner_can_reject_hours(): void
    {
        [$request, , $owner, $provider] = $this->hourlyRequest(40.0);

        $this->actingAs($provider, 'sanctum');
        $entryId = $this->postJson("/api/need-requests/{$request->id}/timesheets", [
            'work_date' => '2026-10-21',
            'minutes' => 30,
        ])->assertStatus(201)->json('data.id');

        $this->actingAs($owner, 'sanctum');
        $this->postJson("/api/need-requests/{$request->id}/timesheets/{$entryId}/reject", [
            'note' => 'That session did not happen.',
        ])->assertOk()->assertJsonPath('data.status', 'rejected');

        // Rejected hours are never paid.
        $this->postJson("/api/need-requests/{$request->id}/timesheets/pay")->assertStatus(422);
    }
}
