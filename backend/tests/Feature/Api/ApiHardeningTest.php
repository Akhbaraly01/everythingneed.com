<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Modules\Needs\Entities\TaskPost;
use Tests\TestCase;
use Database\Seeders\PermissionSeeder;

class ApiHardeningTest extends TestCase
{
    public function test_two_factor_login_endpoint_is_throttled(): void
    {
        $ip = '203.0.113.50';
        $responses = [];
        for ($i = 0; $i < 12; $i++) {
            $responses[] = $this->withHeaders(['REMOTE_ADDR' => $ip, 'X-Forwarded-For' => $ip])
                ->postJson('/api/auth/2fa/login', ['code' => '000000']);
        }

        $codes = array_map(fn ($r) => $r->getStatusCode(), $responses);
        $this->assertContains(429, $codes, '2FA login must return 429 after throttle limit');
    }

    public function test_building_service_show_requires_auth_and_ownership(): void
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();

        $id = (string) Str::uuid();
        DB::table('building_service_bookings')->insert([
            'id' => $id,
            'user_id' => $owner->id,
            'worker_type' => 'plumber',
            'service_category' => 'general',
            'description' => 'Fix a leak',
            'scheduled_date' => now()->toDateString(),
            'address' => '12 Secret Lane',
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->getJson("/api/building-services/{$id}")->assertUnauthorized();

        $this->actingAs($stranger, 'sanctum')
            ->getJson("/api/building-services/{$id}")
            ->assertNotFound();

        $this->actingAs($owner, 'sanctum')
            ->getJson("/api/building-services/{$id}")
            ->assertOk()
            ->assertJsonPath('data.address', '12 Secret Lane');
    }

    public function test_public_tasks_mine_requires_auth(): void
    {
        $this->getJson('/api/tasks?mine=1')->assertUnauthorized();
    }

    public function test_guest_can_list_public_tasks(): void
    {
        TaskPost::create([
            'title' => 'Open task',
            'description' => 'desc',
            'budget' => 10,
            'created_by' => User::factory()->create()->id,
            'post_number' => 'TK-'.strtoupper(uniqid()),
            'status' => TaskPost::STATUS_OPEN,
        ]);

        $this->getJson('/api/tasks')->assertOk();
    }

    public function test_chat_users_does_not_leak_emails(): void
    {
        $me = $this->actingAsUser();
        User::factory()->create(['email' => 'secret@example.test', 'name' => 'Secret Person']);

        $res = $this->getJson('/api/chat/users?q=Secret');
        $res->assertOk();
        $this->assertStringNotContainsString('secret@example.test', $res->getContent());
        $this->assertStringNotContainsString('email', $res->getContent());
    }

    public function test_notification_read_and_delete_404_for_missing(): void
    {
        $user = $this->actingAsUser();

        $this->postJson('/api/notifications/'.Str::uuid().'/read')
            ->assertNotFound();

        $this->deleteJson('/api/notifications/'.Str::uuid())
            ->assertNotFound();
    }

    public function test_wallet_withdraw_is_throttled(): void
    {
        $user = User::factory()->create();
        $ip = '198.51.100.9';
        $codes = [];
        for ($i = 0; $i < 12; $i++) {
            $codes[] = $this->actingAs($user, 'sanctum')
                ->withHeaders(['REMOTE_ADDR' => $ip, 'X-Forwarded-For' => $ip])
                ->postJson('/api/wallet/withdraw', ['amount' => 1, 'reference' => 'T'.$i])
                ->getStatusCode();
        }

        $this->assertContains(429, $codes, 'withdraw must throttle');
    }

    public function test_stripe_webhook_rejects_bad_signature_when_secret_set(): void
    {
        config(['payments.stripe.webhook_secret' => 'whsec_test_secret']);

        $this->withHeaders(['Stripe-Signature' => 't=1,v1=deadbeef'])
            ->postJson('/api/webhooks/payments/stripe', ['id' => 'evt_1', 'type' => 'payment_intent.succeeded'])
            ->assertStatus(400);
    }

    public function test_stripe_webhook_accepts_valid_signature(): void
    {
        $secret = 'whsec_test_secret';
        config(['payments.stripe.webhook_secret' => $secret]);

        $body = json_encode(['id' => 'evt_valid_'.uniqid(), 'type' => 'payment_intent.succeeded', 'data' => ['object' => ['id' => 'pi_missing']]]);
        $ts = time();
        $sig = hash_hmac('sha256', $ts.'.'.$body, $secret);

        $this->call(
            'POST',
            '/api/webhooks/payments/stripe',
            [],
            [],
            [],
            ['CONTENT_TYPE' => 'application/json', 'HTTP_STRIPE_SIGNATURE' => "t={$ts},v1={$sig}"],
            $body
        )->assertOk();
    }

    public function test_stripe_webhook_rejects_replay_outside_window(): void
    {
        $secret = 'whsec_test_secret';
        config(['payments.stripe.webhook_secret' => $secret]);

        $body = json_encode(['id' => 'evt_old', 'type' => 'payment_intent.succeeded']);
        $ts = time() - 3600;
        $sig = hash_hmac('sha256', $ts.'.'.$body, $secret);

        $this->call(
            'POST',
            '/api/webhooks/payments/stripe',
            [],
            [],
            [],
            ['CONTENT_TYPE' => 'application/json', 'HTTP_STRIPE_SIGNATURE' => "t={$ts},v1={$sig}"],
            $body
        )->assertStatus(400);
    }

    public function test_delivery_index_strips_user_pii(): void
    {

        $this->seed(PermissionSeeder::class);        // The roster is a management surface: plain users are denied...
        $this->actingAsUser();
        $this->getJson('/api/delivery/managers')->assertStatus(403);

        // ...and even staff listings never carry account email/contact PII.
        $ops = $this->createUser();
        $this->assignRole($ops, 'platform_ops');

        $rider = $this->createUser();
        \Modules\Delivery\Entities\DeliveryManager::create([
            'user_id' => $rider->id,
            'full_name' => 'Rita Rider',
            'phone' => '+233555000111',
            'vehicle_type' => 'motorbike',
            'is_available' => true,
        ]);

        $res = $this->actingAs($ops, 'sanctum')->getJson('/api/delivery/managers');
        $res->assertOk();
        $this->assertStringNotContainsString('"email"', $res->getContent());
        $this->assertStringContainsString('Rita Rider', $res->getContent());
    }

    public function test_property_viewing_request_alias_creates_viewing_not_property(): void
    {
        $user = $this->actingAsUser();

        $prop = \Modules\RealEstate\Entities\Property::create([
            'title' => 'Cozy loft',
            'description' => 'Nice',
            'price' => 1000,
            'address' => '1 Main',
            'city' => 'Accra',
            'country' => 'GH',
            'property_type' => 'apartment',
            'user_id' => $user->id,
        ]);

        $before = \Modules\RealEstate\Entities\Property::count();

        $this->postJson("/api/properties/{$prop->id}/viewing-requests", [
            'name' => 'Vera',
            'email' => 'vera@example.test',
            'phone' => '+1000000000',
            'message' => 'Want to see',
        ])->assertStatus(201);

        $this->assertEquals($before, \Modules\RealEstate\Entities\Property::count());
        $this->assertDatabaseHas('viewing_requests', [
            'property_id' => $prop->id,
            'user_id' => $user->id,
        ]);
    }

    public function test_api_unauthorized_is_json_not_redirect(): void
    {
        $this->getJson('/api/wallet/balance')
            ->assertUnauthorized()
            ->assertHeader('Content-Type', 'application/json');
    }

    public function test_api_forbidden_is_json_403(): void
    {
        $user = $this->actingAsUser();
        $token = $user->createToken('t')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/admin/stats')
            ->assertForbidden();
    }
}
