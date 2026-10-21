<?php

namespace Tests\Feature\Subscriptions;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Modules\Subscriptions\Entities\Plan;
use Modules\Subscriptions\Entities\Subscription;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * W8 console plan CRUD (/api/admin/plans) + the duration/ends_at
 * regression pins for the subscribe flow. The console API is
 * permission-gated (subscriptions.subscriptions.*), so the seeded role
 * matrix has to be in place.
 */
class AdminPlanCrudTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\PermissionSeeder::class);
        \Illuminate\Support\Facades\Cache::forget('rbac.matrix');
    }

    private function makePlan(array $overrides = []): Plan
    {
        return Plan::create(array_merge([
            'name' => 'Pro Plan',
            'slug' => 'pro-' . Str::lower(Str::random(8)),
            'price' => 29.99,
            'currency' => 'USD',
            'interval' => 'monthly',
            'duration_days' => 30,
            'features' => ['priority_support'],
            'is_active' => true,
        ], $overrides));
    }

    #[Test]
    public function test_admin_lists_all_plans_including_inactive_with_subscriber_counts(): void
    {
        $this->actingAsAdmin();
        $active = $this->makePlan(['name' => 'Active']);
        $this->makePlan(['name' => 'Retired', 'is_active' => false]);

        Subscription::create([
            'user_id' => User::factory()->create()->id,
            'plan_id' => $active->id,
            'status' => 'active',
            'starts_at' => now(),
        ]);

        $res = $this->getJson('/api/admin/plans')->assertOk();
        $this->assertCount(2, $res->json('data'));
        $this->assertSame(2, $res->json('meta.total'));

        $row = collect($res->json('data'))->firstWhere('id', $active->id);
        $this->assertSame(1, $row['subscriptions_count']);
    }

    #[Test]
    public function test_admin_creates_plan_with_defaults_and_auto_slug(): void
    {
        $this->actingAsAdmin();

        $res = $this->postJson('/api/admin/plans', [
            'name' => 'Starter Plan',
            'price' => 9.99,
        ])->assertStatus(201)
            ->assertJsonPath('data.name', 'Starter Plan')
            ->assertJsonPath('data.currency', 'USD')
            ->assertJsonPath('data.interval', 'monthly')
            ->assertJsonPath('data.duration_days', 30)
            ->assertJsonPath('data.is_active', true);

        $slug = $res->json('data.slug');
        $this->assertStringStartsWith('starter-plan-', $slug);
    }

    #[Test]
    public function test_create_rejects_duplicate_slug(): void
    {
        $this->actingAsAdmin();
        $this->makePlan(['slug' => 'gold']);

        $this->postJson('/api/admin/plans', [
            'name' => 'Other',
            'slug' => 'gold',
            'price' => 1,
        ])->assertStatus(422)->assertJsonValidationErrors(['slug']);
    }

    #[Test]
    public function test_admin_updates_every_field(): void
    {
        $this->actingAsAdmin();
        $plan = $this->makePlan();

        $this->putJson("/api/admin/plans/{$plan->id}", [
            'name' => 'Gold Plan',
            'description' => 'Everything included',
            'price' => 49.5,
            'currency' => 'ghs',
            'interval' => 'yearly',
            'duration_days' => 365,
            'features' => ['api_access', 'analytics'],
            'is_active' => false,
        ])->assertOk()
            ->assertJsonPath('data.name', 'Gold Plan')
            ->assertJsonPath('data.currency', 'GHS')
            ->assertJsonPath('data.duration_days', 365)
            ->assertJsonPath('data.is_active', false);

        $fresh = Plan::findOrFail($plan->id);
        $this->assertSame(['api_access', 'analytics'], $fresh->features);
        $this->assertSame('49.50', (string) $fresh->price);
    }

    #[Test]
    public function test_update_empty_payload_is_rejected_and_404s_unknown(): void
    {
        $this->actingAsAdmin();
        $plan = $this->makePlan();

        $this->putJson("/api/admin/plans/{$plan->id}", [])
            ->assertStatus(422)
            ->assertJsonPath('message', 'No changes provided');

        $this->putJson('/api/admin/plans/' . Str::uuid(), ['name' => 'Ghost'])
            ->assertStatus(404);
    }

    #[Test]
    public function test_delete_soft_deletes_and_is_refused_with_subscribers(): void
    {
        $this->actingAsAdmin();
        $free = $this->makePlan(['name' => 'Free']);
        $popular = $this->makePlan(['name' => 'Popular']);

        Subscription::create([
            'user_id' => User::factory()->create()->id,
            'plan_id' => $popular->id,
            'status' => 'cancelled',
            'starts_at' => now()->subMonth(),
        ]);

        $this->deleteJson("/api/admin/plans/{$popular->id}")->assertStatus(422);
        $this->assertNotNull(Plan::find($popular->id));

        $this->deleteJson("/api/admin/plans/{$free->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Plan deleted');

        $this->assertNull(Plan::find($free->id));
        $this->assertNotNull(Plan::withTrashed()->find($free->id)?->deleted_at);

        // Public catalogue hides it too.
        $this->getJson('/api/plans')
            ->assertOk()
            ->assertJsonMissing(['id' => $free->id]);
    }

    #[Test]
    public function test_administrator_can_manage_plans_but_plain_user_cannot(): void
    {
        $plan = $this->makePlan();

        $plain = $this->createUser();
        $this->actingAs($plain, 'sanctum');
        $this->getJson('/api/admin/plans')->assertStatus(403);
        $this->postJson('/api/admin/plans', ['name' => 'X', 'price' => 1])->assertStatus(403);
        $this->putJson("/api/admin/plans/{$plan->id}", ['name' => 'X'])->assertStatus(403);
        $this->deleteJson("/api/admin/plans/{$plan->id}")->assertStatus(403);

        $this->app['auth']->forgetGuards();
        $admin = $this->createUser();
        $this->assignRole($admin, 'administrator');
        $this->actingAs($admin, 'sanctum');
        $this->getJson('/api/admin/plans')->assertOk();
    }

    #[Test]
    public function test_subscribe_sets_ends_at_from_plan_duration(): void
    {
        $user = $this->createUser();
        $plan = $this->makePlan(['duration_days' => 90]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/subscribe', ['plan_id' => $plan->id, 'payment_method' => 'card'])
            ->assertStatus(201);

        $subscription = Subscription::where('user_id', $user->id)->firstOrFail();
        $this->assertNotNull($subscription->ends_at);
        $this->assertEqualsWithDelta(
            now()->addDays(90)->timestamp,
            $subscription->ends_at->timestamp,
            120,
        );
    }

    #[Test]
    public function test_subscribe_rejects_inactive_plan(): void
    {
        $user = $this->createUser();
        $plan = $this->makePlan(['is_active' => false]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/subscribe', ['plan_id' => $plan->id, 'payment_method' => 'card'])
            ->assertStatus(422)
            ->assertJsonPath('message', 'This plan is not available for subscription');
    }

    #[Test]
    public function test_unsubscribe_stamps_cancelled_at(): void
    {
        $user = $this->createUser();
        $plan = $this->makePlan();

        Subscription::create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'starts_at' => now(),
            'ends_at' => now()->addDays(30),
        ]);

        $this->actingAs($user, 'sanctum')->postJson('/api/unsubscribe')->assertOk();

        $this->assertNotNull(Subscription::where('user_id', $user->id)->firstOrFail()->cancelled_at);
    }
}
