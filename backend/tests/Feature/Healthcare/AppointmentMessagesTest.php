<?php

namespace Tests\Feature\Healthcare;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Healthcare\Entities\AppointmentMessage;
use Modules\Healthcare\Entities\Doctor;
use Tests\TestCase;

/**
 * L-H-3: appointment discussion thread ("discuss one's issue") plus the
 * receipt facts exposed on the appointment show resource after payment.
 */
class AppointmentMessagesTest extends TestCase
{
    use RefreshDatabase;

    private function bookAppointment($user): string
    {
        $doctor = Doctor::create([
            'full_name' => 'Dr. '.fake()->name(),
            'specialization' => 'General Medicine',
            'qualification' => 'MBBS',
            'experience_years' => 5,
            'consultation_fee' => 60.00,
            'virtual_fee' => 50.00,
            'is_available' => true,
            'rating' => 4.0,
        ]);

        return $this->actingAs($user, 'sanctum')
            ->postJson('/api/appointments', [
                'doctor_id' => $doctor->id,
                'symptoms' => 'Persistent cough',
                'consultation_type' => 'in_person',
                'appointment_date' => now()->addDays(3)->format('Y-m-d'),
                'appointment_time' => '10:00',
            ])
            ->assertStatus(201)
            ->json('data.id');
    }

    public function test_patient_can_post_and_list_thread_messages(): void
    {
        $patient = $this->createUser();
        $id = $this->bookAppointment($patient);

        $this->actingAs($patient, 'sanctum')
            ->postJson("/api/appointments/{$id}/messages", ['body' => 'Can we move this to Friday?'])
            ->assertStatus(201)
            ->assertJsonPath('data.0.body', 'Can we move this to Friday?')
            ->assertJsonPath('data.0.is_mine', true);

        $this->actingAs($patient, 'sanctum')
            ->getJson("/api/appointments/{$id}/messages")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.author', $patient->name);

        $this->assertDatabaseHas('appointment_messages', [
            'ticket_id' => $id,
            'user_id' => $patient->id,
            'body' => 'Can we move this to Friday?',
        ]);
    }

    public function test_thread_is_private_to_the_patient(): void
    {
        $patient = $this->createUser();
        $stranger = $this->createUser();
        $id = $this->bookAppointment($patient);

        $this->actingAs($patient, 'sanctum')
            ->postJson("/api/appointments/{$id}/messages", ['body' => 'Private concern'])
            ->assertStatus(201);

        $this->actingAs($stranger, 'sanctum')
            ->getJson("/api/appointments/{$id}/messages")
            ->assertStatus(403);

        $this->actingAs($stranger, 'sanctum')
            ->postJson("/api/appointments/{$id}/messages", ['body' => 'hello'])
            ->assertStatus(403);

        $this->assertSame(1, AppointmentMessage::where('ticket_id', $id)->count());
    }

    public function test_admins_can_read_and_join_the_thread(): void
    {
        $patient = $this->createUser();
        $admin = $this->createAdmin();
        $id = $this->bookAppointment($patient);

        $this->actingAs($patient, 'sanctum')
            ->postJson("/api/appointments/{$id}/messages", ['body' => 'Billing question'])
            ->assertStatus(201);

        $this->actingAs($admin, 'sanctum')
            ->getJson("/api/appointments/{$id}/messages")
            ->assertOk()
            ->assertJsonPath('data.0.is_mine', false)
            ->assertJsonPath('data.0.author', $patient->name);
    }

    public function test_body_is_validated(): void
    {
        $patient = $this->createUser();
        $id = $this->bookAppointment($patient);

        $this->actingAs($patient, 'sanctum')
            ->postJson("/api/appointments/{$id}/messages", [])
            ->assertStatus(422)
            ->assertJsonValidationErrors('body');

        $this->actingAs($patient, 'sanctum')
            ->postJson("/api/appointments/{$id}/messages", ['body' => 'x'])
            ->assertStatus(422);
    }

    public function test_cancelled_appointment_is_closed_to_new_messages(): void
    {
        $patient = $this->createUser();
        $id = $this->bookAppointment($patient);

        $this->actingAs($patient, 'sanctum')
            ->postJson("/api/appointments/{$id}/cancel", ['reason' => 'cannot attend'])
            ->assertOk();

        $this->actingAs($patient, 'sanctum')
            ->postJson("/api/appointments/{$id}/messages", ['body' => 'Hello?'])
            ->assertStatus(422);
    }

    public function test_show_exposes_receipt_facts_after_payment(): void
    {
        $patient = $this->createUser();
        $id = $this->bookAppointment($patient);

        $this->actingAs($patient, 'sanctum')
            ->getJson("/api/appointments/{$id}")
            ->assertOk()
            ->assertJsonPath('data.payment_status', 'unpaid')
            ->assertJsonPath('data.payment', null);

        $this->actingAs($patient, 'sanctum')
            ->postJson("/api/appointments/{$id}/pay", ['method' => 'card'])
            ->assertOk();

        $show = $this->actingAs($patient, 'sanctum')
            ->getJson("/api/appointments/{$id}")
            ->assertOk()
            ->assertJsonPath('data.payment_status', 'paid');

        $this->assertNotNull($show->json('data.payment.reference'));
        $this->assertSame(60.0, (float) $show->json('data.payment.amount'));
        $this->assertSame('card', $show->json('data.payment.method'));
        $this->assertNotNull($show->json('data.paid_at'));
    }
}
