<?php

namespace Tests\Feature\Services;

use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Services\Entities\ServiceBooking;
use Modules\Services\Entities\ServiceDefinition;
use Tests\TestCase;

/**
 * Spec 39 (admin creates any service from the dashboard) + spec 100
 * (created service is auto-discoverable and bookable through the
 * appropriate service UI's API).
 */
class AdminServiceDefinitionTest extends TestCase
{
    use RefreshDatabase;

    /** Chainable admin auth (actingAsAdmin returns the User, not $this). */
    private function asAdmin(): static
    {
        $this->actingAsAdmin();

        return $this;
    }

    private function fullPayload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Home Cleaning',
            'category' => 'building',
            'description' => 'Full house deep-clean with eco products.',
            'image_url' => 'https://cdn.example.com/cleaning.jpg',
            'provider' => 'EverythingNeed Partners',
            'pricing_mode' => 'fixed',
            'base_price' => 25000,
            'currency' => 'NGN',
            'location' => 'Bauchi',
            'availability' => ['days' => 'Mon-Sat', 'hours' => '08:00-18:00'],
            'requires_booking' => true,
            'booking_fields' => [
                ['label' => 'Number of rooms', 'type' => 'number', 'required' => true],
                ['label' => 'Preferred date', 'type' => 'date', 'required' => false],
            ],
            'documents' => ['Valid ID', 'Proof of address'],
            'requires_payment' => true,
            'cancellation_rules' => 'Free cancellation up to 24 hours before the appointment.',
            'delivery_rules' => 'Service delivered on-site within 48 hours of confirmation.',
            'status' => 'active',
        ], $overrides);
    }

    public function test_admin_creates_service_with_full_spec_39_field_set(): void
    {
        $res = $this->asAdmin()->postJson('/api/admin/services', $this->fullPayload());

        $res->assertCreated();

        $service = ServiceDefinition::first();
        $this->assertNotNull($service);
        $this->assertSame('Home Cleaning', $service->name);
        $this->assertSame('building', $service->category);
        $this->assertSame('EverythingNeed Partners', $service->provider);
        $this->assertSame('fixed', $service->pricing_mode);
        $this->assertSame('Bauchi', $service->location);
        $this->assertEquals(25000, (float) $service->base_price);
        $this->assertSame('NGN', $service->currency);
        $this->assertSame(['days' => 'Mon-Sat', 'hours' => '08:00-18:00'], $service->availability);
        $this->assertTrue($service->requires_booking);
        $this->assertTrue($service->requires_payment);
        $this->assertCount(2, $service->booking_fields);
        $this->assertSame(['Valid ID', 'Proof of address'], $service->documents);
        $this->assertNotNull($service->cancellation_rules);
        $this->assertNotNull($service->delivery_rules);
        $this->assertSame('active', $service->status);
    }

    public function test_invalid_status_and_pricing_mode_are_rejected(): void
    {
        $this->asAdmin()
            ->postJson('/api/admin/services', $this->fullPayload(['status' => 'weird']))
            ->assertUnprocessable();

        $this->asAdmin()
            ->postJson('/api/admin/services', $this->fullPayload(['pricing_mode' => 'guess']))
            ->assertUnprocessable();

        $this->asAdmin()
            ->postJson('/api/admin/services', $this->fullPayload(['currency' => 'TOOLONG']))
            ->assertUnprocessable();
    }

    public function test_role_without_services_permission_is_forbidden(): void
    {
        $this->seed(PermissionSeeder::class);

        $agent = $this->createUser();
        $this->assignRole($agent, 'support_agent');
        $this->actingAs($agent, 'sanctum');

        $this->postJson('/api/admin/services', $this->fullPayload())
            ->assertForbidden();

        $this->getJson('/api/admin/services')
            ->assertForbidden();
    }

    public function test_admin_can_update_and_delete_service(): void
    {
        $service = ServiceDefinition::create($this->fullPayload());

        $this->asAdmin()
            ->putJson("/api/admin/services/{$service->id}", [
                'name' => 'Home Cleaning Pro',
                'category' => 'building',
                'pricing_mode' => 'hourly',
                'base_price' => 3000,
                'status' => 'draft',
            ])
            ->assertOk();

        $service->refresh();
        $this->assertSame('Home Cleaning Pro', $service->name);
        $this->assertSame('hourly', $service->pricing_mode);
        $this->assertSame('draft', $service->status);

        $this->asAdmin()
            ->deleteJson("/api/admin/services/{$service->id}")
            ->assertOk();

        $this->assertSoftDeleted('service_definitions', ['id' => $service->id]);
    }

    public function test_public_index_lists_only_active_services_with_category_filter(): void
    {
        ServiceDefinition::create($this->fullPayload());
        ServiceDefinition::create($this->fullPayload(['name' => 'Draft Cleaning', 'status' => 'draft']));
        ServiceDefinition::create($this->fullPayload(['name' => 'Inactive Cleaning', 'status' => 'inactive']));
        ServiceDefinition::create($this->fullPayload([
            'name' => 'Meal Prep',
            'category' => 'food',
            'location' => 'Lagos',
        ]));

        $building = $this->getJson('/api/services?category=building')->assertOk()->json('data');
        $names = array_column($building, 'name');
        $this->assertSame(['Home Cleaning'], $names);

        $all = $this->getJson('/api/services')->assertOk()->json('data');
        $allNames = array_column($all, 'name');
        $this->assertContains('Meal Prep', $allNames);
        $this->assertNotContains('Draft Cleaning', $allNames);
        $this->assertNotContains('Inactive Cleaning', $allNames);

        $lagos = $this->getJson('/api/services?location=Lagos')->assertOk()->json('data');
        $this->assertSame(['Meal Prep'], array_column($lagos, 'name'));
    }

    public function test_category_filter_matches_spec_worded_categories(): void
    {
        // Spec 100 wording: category "Building Services" must still show up
        // for UIs that filter on the short token "building".
        ServiceDefinition::create($this->fullPayload(['category' => 'building services']));

        $this->getJson('/api/services?category=building')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Home Cleaning');

        $this->getJson('/api/services?category=food')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_public_show_returns_active_service_and_404s_draft(): void
    {
        $active = ServiceDefinition::create($this->fullPayload());
        $draft = ServiceDefinition::create($this->fullPayload(['name' => 'Draft', 'status' => 'draft']));

        $this->getJson("/api/services/{$active->id}")->assertOk();

        $this->getJson("/api/services/{$draft->id}")->assertNotFound();
        $this->getJson('/api/services/does-not-exist')->assertNotFound();
    }

    public function test_booking_requires_authentication(): void
    {
        $service = ServiceDefinition::create($this->fullPayload());

        $this->postJson("/api/services/{$service->id}/book", ['notes' => 'hi'])
            ->assertUnauthorized();
    }

    public function test_user_books_active_service_with_pending_unpaid_snapshot(): void
    {
        $service = ServiceDefinition::create($this->fullPayload());
        $this->actingAsUser('user');

        $res = $this->postJson("/api/services/{$service->id}/book", [
            'notes' => 'Please arrive early',
            'answers' => ['Number of rooms' => '4'],
        ])->assertCreated();

        $this->assertStringContainsString('Complete payment', $res->json('message'));

        $booking = ServiceBooking::first();
        $this->assertNotNull($booking);
        $this->assertStringStartsWith('SVC-', $booking->booking_number);
        $this->assertSame(ServiceBooking::STATUS_PENDING, $booking->status);
        $this->assertSame(ServiceBooking::PAYMENT_UNPAID, $booking->payment_status);
        $this->assertEquals(25000, (float) $booking->amount);
        $this->assertSame('NGN', $booking->currency);
        $this->assertSame('Please arrive early', $booking->notes);
        $this->assertSame('4', $booking->answers['Number of rooms']);

        $mine = $this->getJson('/api/services/bookings/mine')->assertOk()->json('data');
        $this->assertCount(1, $mine);
        $this->assertSame($booking->booking_number, $mine[0]['booking_number']);
    }

    public function test_booking_non_bookable_or_unavailable_service_fails(): void
    {
        $walkIn = ServiceDefinition::create($this->fullPayload(['requires_booking' => false]));
        $draft = ServiceDefinition::create($this->fullPayload(['name' => 'Draft', 'status' => 'draft']));

        $this->actingAsUser('user');

        $this->postJson("/api/services/{$walkIn->id}/book")->assertUnprocessable();
        $this->postJson("/api/services/{$draft->id}/book")->assertUnprocessable();
        $this->postJson('/api/services/missing-id/book')->assertNotFound();
    }

    public function test_pay_booking_confirms_and_double_pay_is_idempotent(): void
    {
        $service = ServiceDefinition::create($this->fullPayload());
        $this->actingAsUser('user');

        $bookingId = $this->postJson("/api/services/{$service->id}/book")->assertCreated()->json('data.id');

        $this->postJson("/api/services/bookings/{$bookingId}/pay", ['method' => 'card'])
            ->assertOk()
            ->assertJsonPath('data.status', ServiceBooking::STATUS_CONFIRMED)
            ->assertJsonPath('data.payment_status', ServiceBooking::PAYMENT_PAID);

        $first = ServiceBooking::find($bookingId);
        $this->assertNotNull($first->paid_at);
        $paymentId = $first->payment_id;
        $this->assertNotNull($paymentId);

        // Idempotent replay: message says already paid, payment row unchanged.
        $this->postJson("/api/services/bookings/{$bookingId}/pay", ['method' => 'card'])
            ->assertOk()
            ->assertJsonPath('message', 'Booking already paid');

        $this->assertSame($paymentId, ServiceBooking::find($bookingId)->payment_id);
        $this->assertSame(1, \Modules\Payments\Entities\Payment::where('id', $paymentId)->count());
    }

    public function test_zero_price_booking_marks_paid_without_gateway(): void
    {
        $service = ServiceDefinition::create($this->fullPayload([
            'base_price' => 0,
            'requires_payment' => false,
        ]));
        $this->actingAsUser('user');

        $bookingId = $this->postJson("/api/services/{$service->id}/book")->assertCreated()->json('data.id');

        $this->postJson("/api/services/bookings/{$bookingId}/pay", ['method' => 'card'])
            ->assertOk()
            ->assertJsonPath('data.status', ServiceBooking::STATUS_CONFIRMED)
            ->assertJsonPath('data.payment_status', ServiceBooking::PAYMENT_PAID);

        $this->assertNull(ServiceBooking::find($bookingId)->payment_id);
    }

    public function test_cancel_own_paid_booking_refunds_and_strangers_are_forbidden(): void
    {
        $service = ServiceDefinition::create($this->fullPayload());
        $owner = $this->createUser();
        $stranger = $this->createUser();

        $this->actingAs($owner, 'sanctum');
        $bookingId = $this->postJson("/api/services/{$service->id}/book")->assertCreated()->json('data.id');
        $this->postJson("/api/services/bookings/{$bookingId}/pay", ['method' => 'card'])->assertOk();

        $this->actingAs($stranger, 'sanctum');
        $this->postJson("/api/services/bookings/{$bookingId}/cancel")->assertForbidden();

        $this->actingAs($owner, 'sanctum');
        $this->postJson("/api/services/bookings/{$bookingId}/cancel")
            ->assertOk()
            ->assertJsonPath('data.status', ServiceBooking::STATUS_CANCELLED)
            ->assertJsonPath('data.payment_status', ServiceBooking::PAYMENT_REFUNDED);

        // Terminal states cannot be cancelled again.
        $this->postJson("/api/services/bookings/{$bookingId}/cancel")->assertUnprocessable();
    }

    public function test_admin_bookings_console_lists_and_transitions_bookings(): void
    {
        $service = ServiceDefinition::create($this->fullPayload());
        $user = $this->createUser();
        $this->actingAs($user, 'sanctum');
        $bookingId = $this->postJson("/api/services/{$service->id}/book")->assertCreated()->json('data.id');

        $this->asAdmin();

        $list = $this->getJson('/api/admin/services-bookings')->assertOk()->json('data');
        $this->assertCount(1, $list);
        $this->assertSame('SVC-', substr($list[0]['booking_number'], 0, 4));

        $this->putJson("/api/admin/services-bookings/{$bookingId}", ['status' => 'confirmed'])
            ->assertOk()
            ->assertJsonPath('data.status', ServiceBooking::STATUS_CONFIRMED);

        $this->putJson("/api/admin/services-bookings/{$bookingId}", ['status' => 'bogus'])
            ->assertUnprocessable();

        $this->putJson("/api/admin/services-bookings/{$bookingId}", ['status' => 'completed'])
            ->assertOk()
            ->assertJsonPath('data.status', ServiceBooking::STATUS_COMPLETED);
    }

    public function test_admin_cancelling_paid_booking_refunds_it(): void
    {
        $service = ServiceDefinition::create($this->fullPayload());
        $user = $this->createUser();
        $this->actingAs($user, 'sanctum');
        $bookingId = $this->postJson("/api/services/{$service->id}/book")->assertCreated()->json('data.id');
        $this->postJson("/api/services/bookings/{$bookingId}/pay", ['method' => 'card'])->assertOk();

        $this->asAdmin();

        $this->putJson("/api/admin/services-bookings/{$bookingId}", ['status' => 'cancelled'])
            ->assertOk()
            ->assertJsonPath('data.status', ServiceBooking::STATUS_CANCELLED)
            ->assertJsonPath('data.payment_status', ServiceBooking::PAYMENT_REFUNDED);
    }

    public function test_unauthenticated_visitor_cannot_reach_admin_console(): void
    {
        $this->getJson('/api/admin/services')->assertUnauthorized();
        $this->postJson('/api/admin/services', $this->fullPayload())->assertUnauthorized();
    }
}
