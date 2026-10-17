<?php

namespace Tests\Feature\Engagement;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Modules\Jobs\Entities\JobPost;
use Tests\TestCase;

class SavedJobsTest extends TestCase
{
    use RefreshDatabase;

    private function job(): JobPost
    {
        return JobPost::create([
            'user_id' => User::factory()->create()->id,
            'title' => 'Night guard needed',
            'description' => 'Secure the warehouse overnight.',
            'company' => 'SafeCo',
            'location' => 'Accra',
            'job_type' => 'full_time',
        ]);
    }

    public function test_save_job_lists_snapshot_and_unsaves(): void
    {
        $user = User::factory()->create();
        $job = $this->job();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/wishlist', ['product_id' => $job->id, 'entity_type' => 'job'])
            ->assertStatus(201);

        // Duplicate is a clean 409.
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/wishlist', ['product_id' => $job->id, 'entity_type' => 'job'])
            ->assertStatus(409);

        $list = $this->actingAs($user, 'sanctum')->getJson('/api/wishlist');
        $list->assertOk();
        $row = collect($list->json('data'))->firstWhere('entity_id', $job->id);
        $this->assertNotNull($row);
        $this->assertSame('job', $row['entity_type']);
        $this->assertSame('Night guard needed', $row['snapshot']['title']);
        $this->assertSame("/jobs/{$job->id}", $row['snapshot']['link']);

        $this->actingAs($user, 'sanctum')
            ->deleteJson('/api/wishlist/'.$row['id'])
            ->assertOk();
        $this->assertDatabaseMissing('wishlists', ['id' => $row['id']]);
    }

    public function test_save_unknown_job_is_404_and_bad_type_is_422(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/wishlist', ['product_id' => (string) \Illuminate\Support\Str::uuid(), 'entity_type' => 'job'])
            ->assertNotFound();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/wishlist', ['product_id' => 'x', 'entity_type' => 'spaceship'])
            ->assertStatus(422);
    }

    public function test_gone_entities_resolve_to_null_snapshot(): void
    {
        $user = User::factory()->create();
        $job = $this->job();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/wishlist', ['product_id' => $job->id, 'entity_type' => 'job'])
            ->assertStatus(201);

        $job->delete();

        $list = $this->actingAs($user, 'sanctum')->getJson('/api/wishlist');
        $row = collect($list->json('data'))->firstWhere('entity_id', $job->id);
        $this->assertNotNull($row);
        $this->assertNull($row['snapshot']);
    }
}
