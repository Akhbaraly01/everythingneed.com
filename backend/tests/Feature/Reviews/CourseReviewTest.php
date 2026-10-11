<?php

namespace Tests\Feature\Reviews;

use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Modules\Learn\Entities\Course;
use Modules\Learn\Entities\Enrollment;
use Modules\Reviews\Entities\Review;
use Tests\TestCase;

/**
 * L-B.5 course review hardening.
 *
 * Pins the four gaps that were open: enrollment-gated eligibility, one live
 * review per learner per course, a real moderation status with an audit row,
 * and `courses.rating` / `courses.reviews_count` kept in sync with the
 * approved reviews. Non-course types keep their existing behaviour.
 */
class CourseReviewTest extends TestCase
{
    use RefreshDatabase;

    private function seedMatrix(): void
    {
        $this->seed(PermissionSeeder::class);
        Cache::forget('rbac.matrix');
        Cache::forget('rbac.catalog');
    }

    private function userWithRole(string $role): User
    {
        $user = $this->createUser();
        $this->assignRole($user, $role);

        return $user;
    }

    private function course(array $attributes = []): Course
    {
        return Course::factory()->create($attributes);
    }

    private function enroll(User $user, Course $course, int $progress = 40): void
    {
        Enrollment::create([
            'user_id' => $user->id,
            'course_id' => $course->id,
            'progress' => $progress,
        ]);
    }

    private function reviewPayload(Course $course, int $rating = 5, string $comment = 'Great course'): array
    {
        return [
            'reviewable_type' => 'course',
            'reviewable_id' => (string) $course->id,
            'rating' => $rating,
            'comment' => $comment,
        ];
    }

    public function test_guest_cannot_review_a_course(): void
    {
        $course = $this->course();

        $this->postJson('/api/reviews', $this->reviewPayload($course))
            ->assertUnauthorized();

        $this->assertSame(0, Review::count());
    }

    public function test_non_enrolled_learner_is_denied(): void
    {
        $course = $this->course(['rating' => 4.5]);
        $learner = $this->actingAsUser();

        $this->postJson('/api/reviews', $this->reviewPayload($course))
            ->assertStatus(403)
            ->assertJson(['message' => 'Only enrolled learners can review this course']);

        $this->assertSame(0, Review::count());
        $this->assertSame(0, $course->fresh()->reviews_count);
    }

    public function test_enrolled_learner_reviews_once_and_the_aggregate_follows(): void
    {
        $course = $this->course();
        $learner = $this->actingAsUser();
        $this->enroll($learner, $course);

        $created = $this->postJson('/api/reviews', $this->reviewPayload($course, 5));
        $created->assertCreated();
        $this->assertSame('approved', $created->json('data.status'));
        $this->assertTrue((bool) $created->json('data.is_verified_purchase'));

        $fresh = $course->fresh();
        $this->assertSame(1, $fresh->reviews_count);
        $this->assertSame('5.0', (string) $fresh->rating);

        // The public surface shows it exactly once.
        $this->getJson('/api/reviews?reviewable_type=course&reviewable_id='.$course->id)
            ->assertOk()
            ->assertJsonCount(1, 'data');

        // Dedupe: a second live review from the same learner is refused.
        $this->postJson('/api/reviews', $this->reviewPayload($course, 1))
            ->assertStatus(422)
            ->assertJson(['message' => 'You already reviewed this course']);
        $this->assertSame(1, Review::where('reviewable_type', 'course')->count());
    }

    public function test_unknown_course_reads_as_not_found(): void
    {
        $learner = $this->actingAsUser();

        $this->postJson('/api/reviews', [
            'reviewable_type' => 'course',
            'reviewable_id' => (string) Str::uuid(),
            'rating' => 5,
        ])->assertStatus(404);
    }

    public function test_edit_and_delete_recompute_the_average(): void
    {
        $course = $this->course();
        $first = $this->createUser();
        $second = $this->createUser();
        $this->enroll($first, $course);
        $this->enroll($second, $course);

        $one = $this->actingAs($first, 'sanctum')
            ->postJson('/api/reviews', $this->reviewPayload($course, 5))
            ->json('data.id');
        $this->actingAs($second, 'sanctum')
            ->postJson('/api/reviews', $this->reviewPayload($course, 3));

        $this->assertSame('4.0', (string) $course->fresh()->rating);
        $this->assertSame(2, $course->fresh()->reviews_count);

        // An owner edit moves the average.
        $this->actingAs($first, 'sanctum')
            ->putJson('/api/reviews/'.$one, ['rating' => 1])
            ->assertOk();
        $this->assertSame('2.0', (string) $course->fresh()->rating);

        // Deleting collapses it, and an empty course goes back to no rating.
        $this->actingAs($first, 'sanctum')->deleteJson('/api/reviews/'.$one)->assertOk();
        $this->assertSame('3.0', (string) $course->fresh()->rating);
        $this->assertSame(1, $course->fresh()->reviews_count);

        $this->actingAs($second, 'sanctum')
            ->deleteJson('/api/reviews/'.Review::where('reviewable_type', 'course')->first()->id)
            ->assertOk();
        $this->assertNull($course->fresh()->rating);
        $this->assertSame(0, $course->fresh()->reviews_count);
    }

    public function test_hidden_review_leaves_the_public_list_and_can_be_restored(): void
    {
        $this->seedMatrix();
        $course = $this->course();
        $learner = $this->actingAsUser();
        $this->enroll($learner, $course);
        $reviewId = $this->postJson('/api/reviews', $this->reviewPayload($course, 5))
            ->assertCreated()
            ->json('data.id');

        $this->app['auth']->forgetGuards();
        $moderator = $this->userWithRole('moderator');

        $hidden = $this->actingAs($moderator, 'sanctum')
            ->postJson('/api/admin/reviews/'.$reviewId.'/status', ['status' => 'hidden', 'reason' => 'spam'])
            ->assertOk();
        $this->assertSame('hidden', $hidden->json('data.status'));

        // Every transition is auditable (house rule: moderation writes one).
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'review.moderated',
            'entity_type' => 'reviews',
            'entity_id' => $reviewId,
            'performed_by' => $moderator->id,
        ]);

        // Gone from the public read and out of the aggregate...
        $this->getJson('/api/reviews?reviewable_type=course&reviewable_id='.$course->id)
            ->assertOk()
            ->assertJsonCount(0, 'data');
        $this->assertSame(0, $course->fresh()->reviews_count);
        $this->assertNull($course->fresh()->rating);

        // ...but visible to its owner and to the moderator list.
        $this->getJson('/api/admin/reviews?status=hidden')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->app['auth']->forgetGuards();
        $this->actingAs($learner, 'sanctum')
            ->getJson('/api/reviews/mine')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->app['auth']->forgetGuards();

        // Idempotent: repeating the same transition changes nothing.
        $repeat = $this->actingAs($moderator, 'sanctum')
            ->postJson('/api/admin/reviews/'.$reviewId.'/status', ['status' => 'hidden'])
            ->assertOk();
        $this->assertSame('Review already hidden', $repeat->json('message'));

        // Approving restores both publication and the aggregate.
        $this->actingAs($moderator, 'sanctum')
            ->postJson('/api/admin/reviews/'.$reviewId.'/status', ['status' => 'approved'])
            ->assertOk();
        $this->getJson('/api/reviews?reviewable_type=course&reviewable_id='.$course->id)
            ->assertOk()
            ->assertJsonCount(1, 'data');
        $this->assertSame(1, $course->fresh()->reviews_count);
        $this->assertSame('5.0', (string) $course->fresh()->rating);
    }

    public function test_moderation_requires_the_role_and_the_permission(): void
    {
        $course = $this->course();
        $learner = $this->actingAsUser();
        $this->enroll($learner, $course);
        $reviewId = $this->postJson('/api/reviews', $this->reviewPayload($course))
            ->assertCreated()
            ->json('data.id');

        $this->app['auth']->forgetGuards();

        // Role layer: a plain member never reaches the console endpoints.
        $member = $this->createUser();
        $this->actingAs($member, 'sanctum')
            ->getJson('/api/admin/reviews')
            ->assertStatus(403);

        $this->app['auth']->forgetGuards();

        // Permission layer: a moderator whose grant was never seeded is denied.
        $unseeded = $this->userWithRole('moderator');
        $this->actingAs($unseeded, 'sanctum')
            ->postJson('/api/admin/reviews/'.$reviewId.'/status', ['status' => 'hidden'])
            ->assertStatus(403);

        $this->app['auth']->forgetGuards();

        // Guest: unauthenticated on a role-gated API route.
        $this->postJson('/api/admin/reviews/'.$reviewId.'/status', ['status' => 'hidden'])
            ->assertStatus(401);
    }

    public function test_product_reviews_keep_publishing_immediately(): void
    {
        $user = $this->actingAsUser();

        $this->postJson('/api/reviews', [
            'reviewable_type' => 'product',
            'reviewable_id' => (string) Str::uuid(),
            'rating' => 4,
            'comment' => 'Solid product',
        ])->assertCreated();

        $this->getJson('/api/reviews?reviewable_type=product')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_status_filter_is_available_to_the_moderator_list_only(): void
    {
        $this->seedMatrix();
        $course = $this->course();
        $learner = $this->actingAsUser();
        $this->enroll($learner, $course);
        $reviewId = $this->postJson('/api/reviews', $this->reviewPayload($course))
            ->assertCreated()
            ->json('data.id');

        $this->app['auth']->forgetGuards();
        $moderator = $this->userWithRole('moderator');
        $this->actingAs($moderator, 'sanctum')
            ->postJson('/api/admin/reviews/'.$reviewId.'/status', ['status' => 'rejected'])
            ->assertOk();

        // The public endpoint cannot be pointed at hidden rows.
        $this->getJson('/api/reviews?status=hidden&reviewable_type=course&reviewable_id='.$course->id)
            ->assertOk()
            ->assertJsonCount(0, 'data');

        DB::table('reviews')->where('id', $reviewId)->update(['status' => 'hidden']);
        $this->getJson('/api/reviews?status=hidden&reviewable_type=course&reviewable_id='.$course->id)
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }
}
