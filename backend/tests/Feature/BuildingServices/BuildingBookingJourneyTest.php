<?php

namespace Tests\Feature\BuildingServices;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\BuildingServices\Entities\BuildingServiceBooking;
use Modules\BuildingServices\Entities\ServiceWorker;
use Tests\TestCase;

/**
 * W10: building-services lifecycle + admin console parity.
 *
 * Pins the full chain book -> confirm -> in_progress -> completed (the
 * mid states became reachable in W10), role gates on assignment and
 * transitions, terminal-state immutability, and the role-gated admin
 * queue with its status/search filters.
 */
class BuildingBookingJourneyTest extends TestCase
{
    use RefreshDatabase;

    private function makeWorker(string $type = 'plumber'): ServiceWorker
    {
        $user = $this->createUser();

        return ServiceWorker::create([
            'user_id' => $user->id,
            'full_name' => 'Jour Worker',
            'phone' => '0800000010',
            'worker_type' => $type,
            'is_available' => true,
        ]);
    }

    private function book($user, string $type = 'plumber', string $date = '2031-03-01'): string
    {
        return $this->actingAs($user, 'sanctum')
            ->postJson('/api/building-services/book', [
                'worker_type' => $type,
                'scheduled_date' => $date,
                'scheduled_time' => '10:00',
                'address' => '7 Journey Rd',
                'description' => 'DEMO test booking',
            ])
            ->assertStatus(201)
            ->json('data.id');
    }

    public function test_owner_walks_the_full_status_chain_to_completion(): void
    {
        $owner = $this->createUser();
        $bookingId = $this->book($owner);

        $this->actingAs($owner, 'sanctum')
            ->postJson("/api/building-services/bookings/{$bookingId}/transition", ['status' => 'confirmed'])
            ->assertOk()
            ->assertJsonPath('data.status', 'confirmed');

        $this->actingAs($owner, 'sanctum')
            ->postJson("/api/building-services/bookings/{$bookingId}/transition", ['status' => 'in_progress'])
            ->assertOk()
            ->assertJsonPath('data.status', 'in_progress');

        $this->actingAs($owner, 'sanctum')
            ->postJson("/api/building-services/bookings/{$bookingId}/transition", ['status' => 'completed'])
            ->assertOk()
            ->assertJsonPath('data.status', 'completed');

        // Terminal: nothing can move it again.
        $this->actingAs($owner, 'sanctum')
            ->postJson("/api/building-services/bookings/{$bookingId}/transition", ['status' => 'cancelled'])
            ->assertStatus(422);
        $this->assertSame('completed', BuildingServiceBooking::find($bookingId)->status);
    }

    public function test_transitions_are_role_gated_and_status_validated(): void
    {
        $owner = $this->createUser();
        $stranger = $this->createUser();
        $bookingId = $this->book($owner);

        $this->actingAs($stranger, 'sanctum')
            ->postJson("/api/building-services/bookings/{$bookingId}/transition", ['status' => 'completed'])
            ->assertStatus(403);

        // Valid worker id so authorisation (not payload validation) decides.
        $worker = $this->makeWorker('plumber');
        $this->actingAs($stranger, 'sanctum')
            ->postJson("/api/building-services/bookings/{$bookingId}/assign", ['worker_id' => $worker->id])
            ->assertStatus(403);

        // Owner can request it, but only lifecycle statuses pass validation.
        $this->actingAs($owner, 'sanctum')
            ->postJson("/api/building-services/bookings/{$bookingId}/transition", ['status' => 'paid'])
            ->assertStatus(422);

        $this->actingAs($owner, 'sanctum')
            ->postJson("/api/building-services/bookings/{$bookingId}/transition", ['status' => 'cancelled'])
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');
    }

    public function test_admin_queue_lists_bookings_with_status_filter_and_search(): void
    {
        $owner = $this->createUser();
        $doneId = $this->book($owner, 'plumber', '2031-04-01');
        $this->book($owner, 'electrician', '2031-04-02');

        $this->actingAs($owner, 'sanctum')
            ->postJson("/api/building-services/bookings/{$doneId}/transition", ['status' => 'completed'])
            ->assertOk();

        // Admin sees the queue.
        $admin = $this->createAdmin();

        $all = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/building/bookings')
            ->assertOk()
            ->json('data');
        $this->assertGreaterThanOrEqual(2, count($all));

        $completed = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/building/bookings?status=completed')
            ->assertOk()
            ->json('data');
        $this->assertCount(1, $completed);
        $this->assertSame('completed', $completed[0]['status']);

        $search = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/building/bookings?search=electrician')
            ->assertOk()
            ->json('data');
        $this->assertCount(1, $search);

        // Role gate: ordinary customers are locked out of the console.
        $this->actingAs($owner, 'sanctum')
            ->getJson('/api/admin/building/bookings')
            ->assertStatus(403);
    }

    public function test_assignment_uses_a_real_available_worker_and_clashes_are_rejected(): void
    {
        $owner = $this->createUser();
        $worker = $this->makeWorker('plumber');
        $bookingId = $this->book($owner, 'plumber', '2031-05-01');

        // Explicit assignment with quote (canManage = owner).
        $this->actingAs($owner, 'sanctum')
            ->postJson("/api/building-services/bookings/{$bookingId}/assign", [
                'worker_id' => $worker->id,
                'quoted_price' => 140,
            ])
            ->assertOk()
            ->assertJsonPath('data.worker_id', $worker->id);

        // Same slot, second booking: clash rejected (422), never double-booked.
        $clashId = $this->book($owner, 'plumber', '2031-05-01');
        $this->actingAs($owner, 'sanctum')
            ->postJson("/api/building-services/bookings/{$clashId}/assign", ['worker_id' => $worker->id])
            ->assertStatus(422);

        $this->assertEqualsWithDelta(140, (float) BuildingServiceBooking::find($bookingId)->quoted_price, 0.01);
    }

    public function test_store_honours_an_explicitly_chosen_worker(): void
    {
        $owner = $this->createUser();
        // First free worker of the type - what auto-assignment would pick.
        $auto = $this->makeWorker('plumber');
        $chosen = $this->makeWorker('plumber');

        $bookingId = $this->actingAs($owner, 'sanctum')
            ->postJson('/api/building-services/bookings', [
                'worker_type' => 'plumber',
                'scheduled_date' => '2031-06-01',
                'scheduled_time' => '09:00',
                'address' => '8 Chosen Rd',
                'worker_id' => $chosen->id,
            ])
            ->assertStatus(201)
            ->json('data.id');

        $booking = BuildingServiceBooking::find($bookingId);
        $this->assertSame($chosen->id, $booking->worker_id);
        $this->assertNotSame($auto->id, $booking->worker_id);
    }

    public function test_store_rejects_unavailable_or_busy_explicit_workers(): void
    {
        $owner = $this->createUser();
        $busy = $this->makeWorker('plumber');
        $off = $this->makeWorker('plumber');
        $off->update(['is_available' => false]);

        // Occupy the chosen worker's slot first.
        $this->actingAs($owner, 'sanctum')
            ->postJson('/api/building-services/bookings', [
                'worker_type' => 'plumber',
                'scheduled_date' => '2031-06-02',
                'scheduled_time' => '11:00',
                'address' => '9 First Rd',
                'worker_id' => $busy->id,
            ])
            ->assertStatus(201);

        $before = BuildingServiceBooking::count();

        // Same slot again for the now-busy worker -> clash, nothing created.
        $this->actingAs($owner, 'sanctum')
            ->postJson('/api/building-services/bookings', [
                'worker_type' => 'plumber',
                'scheduled_date' => '2031-06-02',
                'scheduled_time' => '11:00',
                'address' => '10 Second Rd',
                'worker_id' => $busy->id,
            ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Selected worker is already booked for that slot');

        // Worker switched off -> unavailable, nothing created.
        $this->actingAs($owner, 'sanctum')
            ->postJson('/api/building-services/bookings', [
                'worker_type' => 'plumber',
                'scheduled_date' => '2031-06-03',
                'scheduled_time' => '12:00',
                'address' => '11 Third Rd',
                'worker_id' => $off->id,
            ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Selected worker is not available');

        $this->assertSame($before, BuildingServiceBooking::count());
    }
}
