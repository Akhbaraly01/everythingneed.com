<?php

namespace Tests\Feature\Subscriptions;

use Tests\TestCase;
use App\Models\User;
use Modules\Subscriptions\Entities\Plan;
use Modules\Subscriptions\Entities\Subscription;
use Modules\Subscriptions\Entities\Invoice;

class SubscriptionTest extends TestCase
{
    private function createPlan(array $attributes = []): Plan
    {
        return Plan::create(array_merge([
            'name' => 'Pro Plan',
            'slug' => 'pro-' . strtolower(uniqid()),
            'description' => 'Full access plan',
            'price' => 29.99,
            'currency' => 'USD',
            'interval' => 'monthly',
            'features' => ['unlimited_access', 'priority_support'],
            'is_active' => true,
        ], $attributes));
    }

    public function test_unauthenticated_user_can_list_plans(): void
    {
        $plan = $this->createPlan();

        $response = $this->getJson('/api/plans');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'slug', 'price', 'currency', 'interval'],
                ],
            ]);

        $this->assertCount(1, $response->json('data'));
    }

    public function test_authenticated_user_can_list_plans(): void
    {
        $user = $this->createUser();
        $this->createPlan(['name' => 'Basic', 'price' => 9.99]);
        $this->createPlan(['name' => 'Premium', 'price' => 49.99]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/plans');

        $response->assertOk();
        $this->assertCount(2, $response->json('data'));
    }

    public function test_inactive_plans_are_not_listed(): void
    {
        $this->createPlan(['name' => 'Active Plan', 'is_active' => true]);
        $this->createPlan(['name' => 'Inactive Plan', 'is_active' => false]);

        $response = $this->getJson('/api/plans');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('Active Plan', $response->json('data.0.name'));
    }

    public function test_user_can_subscribe_to_plan(): void
    {
        $user = $this->createUser();
        $plan = $this->createPlan(['price' => 19.99]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/subscribe', [
                'plan_id' => $plan->id,
                'payment_method' => 'card',
            ]);

        $response->assertStatus(201)
            ->assertJsonFragment(['message' => 'Subscription created successfully'])
            ->assertJsonStructure([
                'data' => ['id', 'user_id', 'plan_id', 'status', 'starts_at'],
            ]);

        $this->assertDatabaseHas('subscriptions', [
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'status' => 'active',
        ]);
    }

    public function test_subscribe_creates_invoice(): void
    {
        $user = $this->createUser();
        $plan = $this->createPlan(['price' => 39.99, 'currency' => 'USD']);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/subscribe', [
                'plan_id' => $plan->id,
                'payment_method' => 'wallet',
            ]);

        $this->assertDatabaseHas('invoices', [
            'user_id' => $user->id,
            'amount' => 39.99,
            'status' => 'paid',
        ]);
    }

    public function test_subscribe_requires_plan_id(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/subscribe', [
                'payment_method' => 'card',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['plan_id']);
    }

    public function test_subscribe_requires_payment_method(): void
    {
        $user = $this->createUser();
        $plan = $this->createPlan();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/subscribe', [
                'plan_id' => $plan->id,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['payment_method']);
    }

    public function test_subscribe_rejects_nonexistent_plan(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/subscribe', [
                'plan_id' => '00000000-0000-0000-0000-000000000000',
                'payment_method' => 'card',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['plan_id']);
    }

    public function test_unauthenticated_user_cannot_subscribe(): void
    {
        $plan = $this->createPlan();

        $response = $this->postJson('/api/subscribe', [
            'plan_id' => $plan->id,
            'payment_method' => 'card',
        ]);

        $response->assertStatus(401);
    }

    public function test_user_can_view_own_subscription(): void
    {
        $user = $this->createUser();
        $plan = $this->createPlan(['name' => 'Gold Plan']);

        $subscription = Subscription::create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'starts_at' => now(),
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/my-subscription');

        $response->assertOk()
            ->assertJsonFragment([
                'id' => $subscription->id,
                'status' => 'active',
            ]);
    }

    public function test_my_subscription_includes_plan_details(): void
    {
        $user = $this->createUser();
        $plan = $this->createPlan(['name' => 'Enterprise', 'price' => 99.99]);

        Subscription::create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'starts_at' => now(),
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/my-subscription');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'id', 'status', 'plan',
                ],
            ]);
    }

    public function test_user_without_subscription_gets_null(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/my-subscription');

        $response->assertOk()
            ->assertJsonFragment(['data' => null]);
    }

    public function test_unauthenticated_user_cannot_view_subscription(): void
    {
        $response = $this->getJson('/api/my-subscription');

        $response->assertStatus(401);
    }

    public function test_user_can_unsubscribe(): void
    {
        $user = $this->createUser();
        $plan = $this->createPlan();

        $subscription = Subscription::create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'starts_at' => now(),
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/unsubscribe');

        $response->assertOk()
            ->assertJsonFragment(['message' => 'Subscription cancelled']);

        $subscription->refresh();
        $this->assertEquals('cancelled', $subscription->status);
    }

    public function test_unsubscribe_when_no_active_subscription(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/unsubscribe');

        $response->assertOk()
            ->assertJsonFragment(['message' => 'Subscription cancelled']);
    }

    public function test_unauthenticated_user_cannot_unsubscribe(): void
    {
        $response = $this->postJson('/api/unsubscribe');

        $response->assertStatus(401);
    }

    public function test_user_only_sees_own_subscription(): void
    {
        $user1 = $this->createUser();
        $user2 = $this->createUser();
        $plan = $this->createPlan();

        Subscription::create([
            'user_id' => $user1->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'starts_at' => now(),
        ]);

        Subscription::create([
            'user_id' => $user2->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'starts_at' => now(),
        ]);

        $response = $this->actingAs($user1, 'sanctum')
            ->getJson('/api/my-subscription');

        $response->assertOk();
        $this->assertEquals($user1->id, $response->json('data.user_id'));
    }

    public function test_cancelled_subscription_not_shown_as_active(): void
    {
        $user = $this->createUser();
        $plan = $this->createPlan();

        Subscription::create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'status' => 'cancelled',
            'starts_at' => now()->subDays(30),
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/my-subscription');

        $response->assertOk()
            ->assertJsonFragment(['data' => null]);
    }

    public function test_full_subscription_flow(): void
    {
        $user = $this->createUser();
        $plan = $this->createPlan(['name' => 'Full Flow Plan', 'price' => 25.00]);

        $listResponse = $this->actingAs($user, 'sanctum')
            ->getJson('/api/plans');
        $listResponse->assertOk();
        $this->assertGreaterThanOrEqual(1, count($listResponse->json('data')));

        $subResponse = $this->actingAs($user, 'sanctum')
            ->postJson('/api/subscribe', [
                'plan_id' => $plan->id,
                'payment_method' => 'card',
            ]);
        $subResponse->assertStatus(201);

        $viewResponse = $this->actingAs($user, 'sanctum')
            ->getJson('/api/my-subscription');
        $viewResponse->assertOk();
        $this->assertEquals('active', $viewResponse->json('data.status'));
        $this->assertEquals($plan->id, $viewResponse->json('data.plan_id'));

        $cancelResponse = $this->actingAs($user, 'sanctum')
            ->postJson('/api/unsubscribe');
        $cancelResponse->assertOk();

        $afterCancelResponse = $this->actingAs($user, 'sanctum')
            ->getJson('/api/my-subscription');
        $afterCancelResponse->assertOk();
        $this->assertNull($afterCancelResponse->json('data'));
    }

    public function test_invoice_is_linked_to_subscription(): void
    {
        $user = $this->createUser();
        $plan = $this->createPlan(['price' => 50.00]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/subscribe', [
                'plan_id' => $plan->id,
                'payment_method' => 'card',
            ]);

        $subscription = Subscription::where('user_id', $user->id)->first();
        $this->assertNotNull($subscription);

        $this->assertDatabaseHas('invoices', [
            'subscription_id' => $subscription->id,
            'user_id' => $user->id,
            'amount' => 50.00,
            'status' => 'paid',
        ]);
    }

    public function test_multiple_users_can_subscribe_to_same_plan(): void
    {
        $plan = $this->createPlan(['name' => 'Popular Plan', 'price' => 15.00]);
        $user1 = $this->createUser();
        $user2 = $this->createUser();

        $this->actingAs($user1, 'sanctum')
            ->postJson('/api/subscribe', [
                'plan_id' => $plan->id,
                'payment_method' => 'card',
            ]);

        $this->actingAs($user2, 'sanctum')
            ->postJson('/api/subscribe', [
                'plan_id' => $plan->id,
                'payment_method' => 'wallet',
            ]);

        $this->assertDatabaseHas('subscriptions', [
            'user_id' => $user1->id,
            'plan_id' => $plan->id,
            'status' => 'active',
        ]);

        $this->assertDatabaseHas('subscriptions', [
            'user_id' => $user2->id,
            'plan_id' => $plan->id,
            'status' => 'active',
        ]);

        $this->assertCount(2, Subscription::where('plan_id', $plan->id)->get());
    }

    public function test_plan_features_are_returned(): void
    {
        $plan = $this->createPlan([
            'features' => ['api_access', 'custom_domain', 'analytics'],
        ]);

        $response = $this->getJson('/api/plans');

        $response->assertOk();
        $features = $response->json('data.0.features');
        $this->assertContains('api_access', $features);
        $this->assertContains('custom_domain', $features);
        $this->assertContains('analytics', $features);
    }
}
