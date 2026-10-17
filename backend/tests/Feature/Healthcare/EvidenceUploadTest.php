<?php

namespace Tests\Feature\Healthcare;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Healthcare\Entities\AidRequest;
use Modules\Healthcare\Entities\Doctor;
use Modules\Healthcare\Entities\HealthTicket;
use Tests\TestCase;

/**
 * Evidence uploads: aid requests and appointment bookings accept optional
 * uploader-produced image URLs (POST /api/upload first). Foreign-scope or
 * external URLs are rejected — never raw client strings.
 */
class EvidenceUploadTest extends TestCase
{
    use RefreshDatabase;

    private function ownUrls(string $userId, int $n = 2): array
    {
        $urls = [];
        for ($i = 1; $i <= $n; $i++) {
            $urls[] = "https://example.com/storage/uploads/u/{$userId}/evidence/photo-{$i}.jpg";
        }

        return $urls;
    }

    public function test_aid_filing_accepts_own_scope_images(): void
    {
        $user = $this->actingAsUser();

        $res = $this->postJson('/api/health/aid', [
            'title' => 'Surgery support',
            'description' => 'Knee surgery needed after the accident.',
            'goal_amount' => 2500,
            'images' => $this->ownUrls($user->id),
        ]);

        $res->assertCreated()->assertJsonPath('data.status', 'pending');
        $this->assertSame(
            $this->ownUrls($user->id),
            AidRequest::find($res->json('data.id'))->images
        );
    }

    public function test_aid_filing_rejects_foreign_and_external_images(): void
    {
        $user = $this->actingAsUser();

        $this->postJson('/api/health/aid', [
            'title' => 'Hotlinked',
            'description' => 'Trying another account files.',
            'goal_amount' => 100,
            'images' => ['https://example.com/storage/uploads/u/someone-else/evidence/x.jpg'],
        ])->assertStatus(422);

        $this->postJson('/api/health/aid', [
            'title' => 'External',
            'description' => 'Trying the open web.',
            'goal_amount' => 100,
            'images' => ['https://cdn.evil.example/pic.jpg'],
        ])->assertStatus(422);

        $this->postJson('/api/health/aid', [
            'title' => 'Too many',
            'description' => 'Six is over the cap.',
            'goal_amount' => 100,
            'images' => $this->ownUrls($user->id, 6),
        ])->assertStatus(422);
    }

    public function test_booking_accepts_and_returns_evidence_images(): void
    {
        $user = $this->actingAsUser();
        $doctor = Doctor::create([
            'full_name' => 'Dr. Evidence',
            'specialization' => 'General Practice',
            'profession' => 'doctor',
            'qualification' => 'MBBS',
            'experience_years' => 5,
            'consultation_fee' => 100,
            'is_available' => true,
        ]);

        $res = $this->postJson('/api/appointments', [
            'doctor_id' => $doctor->id,
            'symptoms' => 'Swollen knee after a fall',
            'images' => $this->ownUrls($user->id, 1),
        ]);

        $res->assertCreated();
        $ticket = HealthTicket::find($res->json('data.id'));
        $this->assertSame($this->ownUrls($user->id, 1), $ticket->images);
        $this->assertSame($this->ownUrls($user->id, 1), $res->json('data.images'));
    }

    public function test_booking_rejects_foreign_images(): void
    {
        $this->actingAsUser();
        $doctor = Doctor::create([
            'full_name' => 'Dr. Evidence Two',
            'specialization' => 'General Practice',
            'profession' => 'doctor',
            'qualification' => 'MBBS',
            'experience_years' => 5,
            'consultation_fee' => 100,
            'is_available' => true,
        ]);

        $this->postJson('/api/appointments', [
            'doctor_id' => $doctor->id,
            'symptoms' => 'A checkup',
            'images' => ['https://cdn.evil.example/pic.jpg'],
        ])->assertStatus(422);
    }
}
