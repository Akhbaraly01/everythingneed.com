<?php

namespace Tests\Feature\Healthcare;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Healthcare\Entities\HealthTicket;
use Tests\TestCase;

class VideoRoomTest extends TestCase
{
    use RefreshDatabase;

    public function test_patient_gets_jitsi_room_for_virtual_appointment(): void
    {
        $patient = User::factory()->create();
        $ticket = HealthTicket::create([
            'patient_id' => $patient->id,
            'ticket_number' => 'HT-VR-001',
            'symptoms' => 'Follow-up skin check',
            'consultation_type' => 'virtual',
            'status' => 'assigned',
        ]);

        $res = $this->actingAs($patient)->postJson("/api/appointments/{$ticket->id}/video-room");
        $res->assertStatus(200);
        $this->assertEquals('jitsi', $res->json('data.provider'));
        $this->assertStringStartsWith('https://meet.jit.si/everythingneed-HTVR001', $res->json('data.join_url'));
    }

    public function test_physical_appointments_are_rejected_and_strangers_blocked(): void
    {
        $patient = User::factory()->create();
        $stranger = User::factory()->create();
        $ticket = HealthTicket::create([
            'patient_id' => $patient->id,
            'ticket_number' => 'HT-VR-002',
            'symptoms' => 'In-person physio',
            'consultation_type' => 'physical',
            'status' => 'assigned',
        ]);

        $this->actingAs($stranger)
            ->postJson("/api/appointments/{$ticket->id}/video-room")
            ->assertStatus(403);

        $this->actingAs($patient)
            ->postJson("/api/appointments/{$ticket->id}/video-room")
            ->assertStatus(422);
    }
}
