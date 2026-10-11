<?php

namespace Tests\Feature\Experts;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Modules\Healthcare\Entities\Doctor;
use Tests\TestCase;

class ExpertApiTest extends TestCase
{
    use RefreshDatabase;

    private function makeExpert(array $overrides = []): Doctor
    {
        return Doctor::create(array_merge([
            'full_name' => 'Dr. '.fake()->name(),
            'specialization' => 'Cardiology',
            'qualification' => 'MBBS, MD',
            'experience_years' => 10,
            'consultation_fee' => 50.00,
            'virtual_fee' => 40.00,
            'is_available' => true,
            'rating' => 4.0,
        ], $overrides));
    }

    private function makeAvailability(string $expertId, bool $available = true, ?string $nextAvailableAt = null): string
    {
        $id = (string) Str::uuid();
        DB::table('expert_availability')->insert([
            'id' => $id,
            'expert_id' => $expertId,
            'expert_type' => 'doctor',
            'current_status' => 'online',
            'is_available' => $available,
            'status_message' => null,
            'next_available_at' => $nextAvailableAt,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $id;
    }

    public function test_guests_can_list_experts(): void
    {
        $this->makeExpert(['specialization' => 'Cardiology', 'rating' => 4.5]);

        $response = $this->getJson('/api/experts')->assertOk();

        $this->assertNotEmpty($response->json('data'));
        $this->assertArrayHasKey('meta', $response->json());
    }

    public function test_index_filters_by_specialty_and_availability(): void
    {
        $this->makeExpert(['specialization' => 'Cardiology', 'is_available' => true]);
        $this->makeExpert(['specialization' => 'Neurology', 'is_available' => false]);
        $this->makeExpert(['specialization' => 'Cardiology', 'is_available' => false]);

        $cardio = $this->getJson('/api/experts?specialty=Cardiology')->assertOk();
        $this->assertCount(2, $cardio->json('data'));
        $this->assertTrue(collect($cardio->json('data'))->every(
            fn ($row) => $row['specialization'] === 'Cardiology'
        ));

        $available = $this->getJson('/api/experts?available=1')->assertOk();
        $this->assertNotEmpty($available->json('data'));
        $this->assertTrue(collect($available->json('data'))->every(
            fn ($row) => (bool) $row['is_available']
        ));
    }

    public function test_index_orders_by_rating_desc(): void
    {
        $this->makeExpert(['rating' => 2.1]);
        $this->makeExpert(['rating' => 4.9]);

        $ratings = collect($this->getJson('/api/experts')->assertOk()->json('data'))
            ->pluck('rating')
            ->map(fn ($r) => (float) $r)
            ->all();

        $this->assertEquals($ratings, collect($ratings)->sortDesc()->values()->all());
    }

    public function test_show_returns_expert_with_recent_reviews(): void
    {
        $expert = $this->makeExpert();
        $userId = User::factory()->create()->id;
        DB::table('expert_reviews')->insert([
            'id' => (string) Str::uuid(),
            'expert_id' => $expert->id,
            'user_id' => $userId,
            'rating' => 5,
            'comment' => 'Excellent',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->getJson("/api/experts/{$expert->id}")->assertOk();

        $this->assertEquals($expert->id, $response->json('data.id'));
        $this->assertCount(1, $response->json('reviews'));
        $this->assertEquals(5, $response->json('reviews.0.rating'));
    }

    public function test_show_unknown_expert_returns_404(): void
    {
        $this->getJson('/api/experts/'.Str::uuid())->assertNotFound();
    }

    public function test_review_requires_authentication(): void
    {
        $expert = $this->makeExpert();

        $this->postJson("/api/experts/{$expert->id}/review", ['rating' => 5])
            ->assertUnauthorized();
    }

    public function test_review_validates_rating_range(): void
    {
        $user = User::factory()->create();
        $expert = $this->makeExpert();

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/experts/{$expert->id}/review", ['rating' => 6])
            ->assertStatus(422);

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/experts/{$expert->id}/review", [])
            ->assertStatus(422);
    }

    public function test_review_persists_and_appears_in_show(): void
    {
        $user = User::factory()->create();
        $expert = $this->makeExpert();

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/experts/{$expert->id}/review", [
                'rating' => 4,
                'comment' => 'Very helpful',
            ])
            ->assertStatus(201);

        $this->assertDatabaseHas('expert_reviews', [
            'expert_id' => $expert->id,
            'user_id' => $user->id,
            'rating' => 4,
            'comment' => 'Very helpful',
        ]);

        $show = $this->getJson("/api/experts/{$expert->id}")->assertOk();
        $this->assertCount(1, $show->json('reviews'));
    }

    public function test_availability_returns_next_slot_as_date_map(): void
    {
        $expert = $this->makeExpert();
        $this->makeAvailability($expert->id, true, '2026-10-07 09:30:00');

        $response = $this->getJson("/api/experts/{$expert->id}/availability")->assertOk();
        // The profile grid renders Record<date, string[]>; the table stores
        // a single next_available_at moment, surfaced as one slot.
        $this->assertEquals(['2026-10-07' => ['09:30']], $response->json('data'));
    }

    public function test_availability_ignores_disabled_slots_and_unknown_experts(): void
    {
        $expert = $this->makeExpert();
        $this->makeAvailability($expert->id, false, '2026-10-07 09:30:00');

        $disabled = $this->getJson("/api/experts/{$expert->id}/availability")->assertOk();
        $this->assertEquals([], $disabled->json('data'));

        $unknown = $this->getJson('/api/experts/'.Str::uuid().'/availability')->assertOk();
        $this->assertEquals([], $unknown->json('data'));
    }
}
