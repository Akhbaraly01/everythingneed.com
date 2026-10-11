<?php

namespace Tests\Feature\Reviews;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Modules\Reviews\Entities\Review;
use Tests\TestCase;

class ReviewApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_list_reviews_and_cannot_mutate(): void
    {
        $user = $this->createUser();
        Review::create([
            'user_id' => $user->id,
            'reviewable_type' => 'product',
            'reviewable_id' => (string) Str::uuid(),
            'rating' => 5,
            'comment' => 'Great',
        ]);

        $this->getJson('/api/reviews')->assertOk()->assertJsonCount(1, 'data');

        $this->postJson('/api/reviews', [
            'reviewable_type' => 'product',
            'reviewable_id' => (string) Str::uuid(),
            'rating' => 5,
        ])->assertUnauthorized();
    }

    public function test_user_can_create_update_delete_own_review(): void
    {
        $me = $this->actingAsUser();
        $pid = (string) Str::uuid();

        $res = $this->postJson('/api/reviews', [
            'reviewable_type' => 'product',
            'reviewable_id' => $pid,
            'rating' => 4,
            'comment' => 'Nice',
        ]);
        $res->assertCreated();
        $id = $res->json('data.id');

        $this->putJson("/api/reviews/{$id}", ['rating' => 5])->assertOk();
        $this->assertDatabaseHas('reviews', ['id' => $id, 'rating' => 5, 'user_id' => $me->id]);

        $this->getJson('/api/reviews/mine')->assertOk()->assertJsonCount(1, 'data');

        $this->deleteJson("/api/reviews/{$id}")->assertOk();
        $this->assertSoftDeleted('reviews', ['id' => $id]);
    }

    public function test_cannot_update_or_delete_others_review(): void
    {
        $owner = $this->createUser();
        $stranger = $this->createUser();
        $review = Review::create([
            'user_id' => $owner->id,
            'reviewable_type' => 'product',
            'reviewable_id' => (string) Str::uuid(),
            'rating' => 3,
        ]);

        $this->actingAs($stranger, 'sanctum');
        $this->putJson("/api/reviews/{$review->id}", ['rating' => 1])->assertNotFound();
        $this->deleteJson("/api/reviews/{$review->id}")->assertNotFound();
        $this->assertDatabaseHas('reviews', ['id' => $review->id, 'rating' => 3]);
    }

    public function test_review_validation_rejects_bad_rating_and_type(): void
    {
        $this->actingAsUser();

        $this->postJson('/api/reviews', [
            'reviewable_type' => 'nonsense',
            'reviewable_id' => (string) Str::uuid(),
            'rating' => 4,
        ])->assertStatus(422);

        $this->postJson('/api/reviews', [
            'reviewable_type' => 'product',
            'reviewable_id' => (string) Str::uuid(),
            'rating' => 99,
        ])->assertStatus(422);
    }
}
