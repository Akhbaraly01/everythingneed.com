<?php

namespace Tests\Feature\Experts;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Modules\Healthcare\Entities\Doctor;
use Tests\TestCase;

class ExpertReviewTest extends TestCase
{
    use RefreshDatabase;

    private function expert(): Doctor
    {
        return Doctor::create([
            'full_name' => 'Dr. Review Target',
            'specialization' => 'Cardiology',
            'qualification' => 'MBBS, MD',
            'experience_years' => 10,
            'consultation_fee' => 50.00,
            'is_available' => true,
        ]);
    }

    public function test_public_review_list_and_submit_flow(): void
    {
        $expert = $this->expert();

        // Empty list renders (no 404 on fresh experts).
        $this->getJson("/api/experts/{$expert->id}/reviews")
            ->assertOk()
            ->assertJsonPath('meta.total', 0);

        $user = User::factory()->create();
        $this->actingAs($user, 'sanctum')
            ->postJson("/api/experts/{$expert->id}/review", ['rating' => 5, 'comment' => 'Thorough and kind.'])
            ->assertStatus(201);

        $list = $this->getJson("/api/experts/{$expert->id}/reviews");
        $list->assertOk()->assertJsonPath('meta.total', 1);
        $row = $list->json('data.0');
        $this->assertSame(5, $row['rating']);
        $this->assertSame('Thorough and kind.', $row['comment']);
        $this->assertSame($user->name, $row['user_name'] ?? null);
    }

    public function test_review_validation_and_guest_gate(): void
    {
        $expert = $this->expert();

        // Guests cannot post.
        $this->postJson("/api/experts/{$expert->id}/review", ['rating' => 5])
            ->assertUnauthorized();

        $user = User::factory()->create();
        // Rating bounds enforced.
        $this->actingAs($user, 'sanctum')
            ->postJson("/api/experts/{$expert->id}/review", ['rating' => 9])
            ->assertStatus(422);
        $this->actingAs($user, 'sanctum')
            ->postJson("/api/experts/{$expert->id}/review", [])
            ->assertStatus(422);
    }

    public function test_admin_can_list_and_delete_expert_reviews(): void
    {
        $expert = $this->expert();
        $user = User::factory()->create();
        $this->actingAs($user, 'sanctum')
            ->postJson("/api/experts/{$expert->id}/review", ['rating' => 2, 'comment' => 'Rude.'])
            ->assertStatus(201);
        $rowId = DB::table('expert_reviews')->value('id');

        $admin = User::factory()->create();
        \App\Models\UserRole::create(['user_id' => $admin->id, 'role' => 'administrator']);
        $this->seed(\Database\Seeders\PermissionSeeder::class);

        $list = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/expert-reviews');
        $list->assertOk()->assertJsonPath('meta.total', 1);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/admin/expert-reviews/{$rowId}")
            ->assertOk();
        $this->assertDatabaseMissing('expert_reviews', ['id' => $rowId]);

        // Second delete is a clean 404.
        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/admin/expert-reviews/{$rowId}")
            ->assertNotFound();
    }
}
