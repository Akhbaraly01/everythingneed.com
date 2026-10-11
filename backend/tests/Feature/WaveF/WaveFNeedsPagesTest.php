<?php

namespace Tests\Feature\WaveF;

use Database\Seeders\PermissionSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Needs\Entities\NeedCategory;
use Modules\Needs\Entities\NeedRequest;
use Tests\TestCase;

/**
 * Wave F (spec S10-S14): web routes for the Needs surface render the right
 * components with the right server props, and the endpoints the new pages
 * call (chat, upload, filtered reviews) honour their contracts.
 */
class WaveFNeedsPagesTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        Cache::forget('rbac.matrix');
    }

    private function createCategory(): NeedCategory
    {
        return NeedCategory::create([
            'name' => 'Plumbing',
            'slug' => 'plumbing-'.uniqid(),
            'description' => 'Pipes and leaks',
            'icon' => 'wrench',
            'color' => '#3B82F6',
        ]);
    }

    private function createNeedFor($owner, NeedCategory $category, array $overrides = []): NeedRequest
    {
        return NeedRequest::create(array_merge([
            'user_id' => $owner->id,
            'category_id' => $category->id,
            'request_number' => 'NR-'.strtoupper(uniqid()),
            'title' => 'Replace kitchen mixer tap',
            'description' => 'Leaking mixer tap needs replacing.',
            'status' => 'pending',
            'budget_max' => 120,
            'currency' => 'USD',
            'location' => 'Lagos',
        ], $overrides));
    }

    public function test_needs_index_renders_all_spec_sections(): void
    {
        $expected = [
            'activeRequests', 'nearbyServices', 'featuredServices', 'deals',
            'workers', 'professionals', 'transportation', 'hotels',
            'construction', 'agriculture', 'food', 'jobs',
            'realEstate', 'pharmacy', 'healthcare', 'generalServices',
        ];

        $this->get('/needs')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('needs/Index')
            ->has('categories')
            ->where('sections', function ($sections) use ($expected) {
                if ($sections instanceof \Illuminate\Support\Collection) {
                    $sections = $sections->all();
                }
                if ($sections instanceof \stdClass) {
                    $sections = (array) $sections;
                }

                return is_array($sections) && array_keys($sections) === $expected;
            }));
    }

    public function test_needs_create_requires_auth_and_renders_the_form(): void
    {
        $this->get('/needs/create')->assertRedirect();

        $this->actingAsUser();
        $this->get('/needs/create')->assertOk()->assertInertia(
            fn (Assert $page) => $page->component('needs/Request')
        );
    }

    public function test_my_needs_workspace_pages_render_with_need_id(): void
    {
        $owner = $this->actingAsUser();
        $category = $this->createCategory();
        $need = $this->createNeedFor($owner, $category);

        $this->get('/needs/my-needs')->assertOk()->assertInertia(
            fn (Assert $page) => $page->component('needs/MyNeeds')
        );

        $pages = [
            "/needs/my-needs/{$need->id}" => 'needs/my/Overview',
            "/needs/my-needs/{$need->id}/offers" => 'needs/my/Offers',
            "/needs/my-needs/{$need->id}/messages" => 'needs/my/Messages',
            "/needs/my-needs/{$need->id}/payment" => 'needs/my/Payment',
            "/needs/my-needs/{$need->id}/tracking" => 'needs/my/Tracking',
            "/needs/my-needs/{$need->id}/review" => 'needs/my/Review',
        ];

        foreach ($pages as $url => $component) {
            $this->get($url)->assertOk()->assertInertia(fn (Assert $page) => $page
                ->component($component)
                ->where('need_id', $need->id));
        }
    }

    public function test_private_needs_pages_redirect_guests_to_login(): void
    {
        $owner = $this->createUser();
        $category = $this->createCategory();
        $need = $this->createNeedFor($owner, $category);

        foreach ([
            '/needs/my-needs',
            "/needs/my-needs/{$need->id}",
            "/needs/my-needs/{$need->id}/offers",
            "/needs/my-needs/{$need->id}/messages",
            "/needs/my-needs/{$need->id}/payment",
            "/needs/my-needs/{$need->id}/tracking",
            "/needs/my-needs/{$need->id}/review",
            '/needs/create',
            "/needs/{$category->slug}/{$need->id}",
            "/needs/requests/{$need->id}",
        ] as $url) {
            $this->get($url)->assertRedirect();
        }
    }

    public function test_canonical_and_legacy_detail_routes_render_show(): void
    {
        $owner = $this->actingAsUser();
        $category = $this->createCategory();
        $need = $this->createNeedFor($owner, $category);

        $this->get("/needs/{$category->slug}/{$need->id}")->assertOk()->assertInertia(
            fn (Assert $page) => $page
                ->component('needs/Show')
                ->where('need_id', $need->id)
                ->where('category_slug', $category->slug)
        );

        // Legacy pinned route keeps working (S12 canonical is additive).
        $this->get("/needs/requests/{$need->id}")->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('needs/Show')
            ->where('need_id', $need->id)
            ->missing('category_slug'));
    }

    public function test_category_page_uses_server_rendered_requests(): void
    {
        $owner = $this->actingAsUser();
        $category = $this->createCategory();
        $open = $this->createNeedFor($owner, $category);
        $this->createNeedFor($owner, $category, [
            'status' => 'completed',
            'title' => 'Closed request',
        ]);

        $this->get("/needs/{$category->slug}")->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('needs/Category')
            ->where('slug', $category->slug)
            ->where('category.name', $category->name)
            ->has('requests', 1)
            ->where('requests.0.id', $open->id)
            ->where('requests.0.url', "/needs/{$category->slug}/{$open->id}")
            ->where('items', []));

        // Unknown slug still renders honestly (no fake category, no rows).
        $this->get('/needs/not-a-real-category')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('needs/Category')
            ->where('slug', 'not-a-real-category')
            ->where('category', null)
            ->where('requests', []));
    }

    public function test_need_messages_page_backing_chat_endpoints(): void
    {
        $owner = $this->actingAsUser();
        $category = $this->createCategory();
        $need = $this->createNeedFor($owner, $category);

        $provider = $this->actingAsUser();
        $conversation = $this->postJson('/api/chat/conversations', [
            'recipient_id' => $owner->id,
            'booking_id' => $need->id,
        ]);
        $conversation->assertStatus(201);
        $conversationId = $conversation->json('data.id');
        $this->assertEquals($need->id, $conversation->json('data.booking_id'));

        $this->postJson("/api/chat/{$conversationId}/messages", [
            'message' => 'I can start tomorrow morning.',
        ])->assertStatus(201);

        // Re-opening with the same pair + need returns the same thread.
        $again = $this->postJson('/api/chat/conversations', [
            'recipient_id' => $owner->id,
            'booking_id' => $need->id,
        ]);
        $again->assertStatus(201);
        $this->assertEquals($conversationId, $again->json('data.id'));

        // The requester sees the message.
        $this->actingAs($owner, 'sanctum');
        $this->getJson("/api/chat/{$conversationId}/messages")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['message' => 'I can start tomorrow morning.']);
    }

    public function test_need_form_upload_contract_uses_the_media_endpoint(): void
    {
        $this->actingAsUser();

        $res = $this->postJson('/api/upload', [
            'file' => UploadedFile::fake()->image('tap.jpg', 640, 480),
            'folder' => 'need-images',
        ]);

        $res->assertStatus(201);
        $this->assertNotEmpty($res->json('data.url'));
        $this->assertStringContainsString('need-images', (string) $res->json('data.url'));
        $this->assertEquals('tap.jpg', $res->json('data.name'));
    }
}
