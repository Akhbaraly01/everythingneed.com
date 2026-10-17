<?php

namespace Tests\Feature\Admin;

use Modules\Needs\Entities\FraudFlag;
use Modules\Needs\Entities\NeedCategory;
use Modules\Needs\Entities\NeedProviderProfile;
use Modules\Needs\Entities\NeedRequest;
use Modules\Needs\Entities\NeedRequestEvent;
use Modules\Needs\Entities\TaskPost;
use Modules\Orders\Entities\Dispute;
use Tests\TestCase;

/**
 * P0 admin needs console: role gates, moderation transitions, fraud flags,
 * needs-scoped disputes, and audit rows.
 */
class AdminNeedsConsoleTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        // EffectivePermissionResolver reads the role_permissions table, which
        // RefreshDatabase leaves empty: seed the matrix like the other
        // permission-gated console suites do.
        $this->seed(\Database\Seeders\PermissionSeeder::class);
    }
    private function createCategory(): NeedCategory
    {
        return NeedCategory::create([
            'name' => 'Cleaning',
            'slug' => 'cleaning-' . uniqid(),
            'description' => 'Home cleaning',
            'icon' => 'sparkles',
            'color' => '#10B981',
        ]);
    }

    private function createRequest(array $overrides = []): NeedRequest
    {
        $category = $this->createCategory();
        $owner = $this->actingAsUser();

        $created = $this->postJson('/api/need-requests', array_merge([
            'title' => 'Deep clean 3-bedroom apartment',
            'description' => 'Full deep clean including windows.',
            'category_id' => $category->id,
            'budget_min' => 80,
            'budget_max' => 150,
            'location' => 'Downtown',
        ], $overrides));

        $created->assertStatus(201);

        return NeedRequest::findOrFail($created->json('data.id'));
    }

    public function test_guest_cannot_access_admin_needs(): void
    {
        $this->getJson('/api/admin/needs/requests')->assertStatus(401);
        $this->getJson('/api/admin/needs/fraud-flags')->assertStatus(401);
    }

    public function test_customer_without_permission_is_forbidden(): void
    {
        $this->actingAsUser();

        $this->getJson('/api/admin/needs/requests')->assertStatus(403);
        $this->postJson('/api/admin/needs/fraud-scan')->assertStatus(403);
    }

    public function test_needs_admin_can_list_requests(): void
    {
        $request = $this->createRequest();

        $this->actingAsUser('needs_admin');

        $this->getJson('/api/admin/needs/requests')
            ->assertOk()
            ->assertJsonFragment(['id' => $request->id]);

        $this->getJson('/api/admin/needs/requests?status=pending')
            ->assertOk()
            ->assertJsonFragment(['id' => $request->id]);
    }

    public function test_admin_request_detail_includes_offers_and_events(): void
    {
        $request = $this->createRequest();

        $provider = $this->actingAsUser();
        $this->postJson("/api/need-requests/{$request->id}/offers", [
            'price' => 120,
            'message' => 'Available tomorrow.',
        ])->assertStatus(201);

        $this->actingAsUser('needs_admin');

        $this->getJson("/api/admin/needs/requests/{$request->id}")
            ->assertOk()
            ->assertJsonStructure(['data' => ['id', 'offers', 'events']]);
    }

    public function test_needs_admin_can_reject_request_with_note_and_audit(): void
    {
        $request = $this->createRequest();

        $this->actingAsUser('needs_admin');

        $this->postJson("/api/admin/needs/requests/{$request->id}/moderate", [
            'action' => 'reject',
            'note' => 'Spam content removed.',
        ])->assertOk();

        $this->assertEquals(NeedRequest::STATUS_REJECTED, $request->fresh()->status);
        $this->assertDatabaseHas('need_request_events', [
            'need_request_id' => $request->id,
            'action' => 'moderator_note',
        ]);
        $this->assertDatabaseHas('need_request_events', [
            'need_request_id' => $request->id,
            'action' => 'reject',
            'to_status' => NeedRequest::STATUS_REJECTED,
        ]);
    }

    public function test_moderator_role_cannot_moderate_needs(): void
    {
        $request = $this->createRequest();

        // Least privilege: the generic moderator role holds no needs.* grant.
        $this->actingAsUser('moderator');

        $this->postJson("/api/admin/needs/requests/{$request->id}/moderate", [
            'action' => 'reject',
        ])->assertStatus(403);
    }

    public function test_admin_can_delete_pending_offer_but_not_accepted(): void
    {
        $request = $this->createRequest();
        $owner = $request->user;

        $provider = $this->actingAsUser();
        $offerA = $this->postJson("/api/need-requests/{$request->id}/offers", [
            'price' => 120,
            'message' => 'First bid.',
        ])->assertStatus(201)->json('data.id');

        $providerB = $this->actingAsUser();
        $offerB = $this->postJson("/api/need-requests/{$request->id}/offers", [
            'price' => 100,
            'message' => 'Second bid.',
        ])->assertStatus(201)->json('data.id');

        // Owner accepts offer B so it becomes protected.
        $this->actingAs($owner, 'sanctum');
        $this->postJson("/api/need-requests/{$request->id}/offers/{$offerB}/accept")->assertOk();

        $this->actingAsUser('needs_admin');

        $this->deleteJson("/api/admin/needs/offers/{$offerA}")->assertOk();
        // Soft-deleted (base model): row retained for audit, hidden lists.
        $this->assertSoftDeleted('need_offers', ['id' => $offerA]);
        $this->getJson('/api/admin/needs/offers')->assertOk()->assertJsonMissing(['id' => $offerA]);

        $this->deleteJson("/api/admin/needs/offers/{$offerB}")->assertStatus(422);
        $this->assertDatabaseHas('need_offers', ['id' => $offerB]);
    }

    public function test_admin_can_cancel_and_restore_task(): void
    {
        $owner = $this->actingAsUser();

        $created = $this->postJson('/api/tasks', [
            'title' => 'Distribute 500 flyers downtown',
            'description' => 'Hand out flyers near the market square this weekend.',
            'quantity' => 500,
            'budget' => 75,
        ])->assertStatus(201);
        $taskId = $created->json('data.id');

        $this->actingAsUser('needs_admin');

        $this->postJson("/api/admin/needs/tasks/{$taskId}/cancel")->assertOk();
        $this->assertEquals(TaskPost::STATUS_CANCELLED, TaskPost::find($taskId)->status);

        $this->postJson("/api/admin/needs/tasks/{$taskId}/cancel")->assertStatus(422);

        $this->postJson("/api/admin/needs/tasks/{$taskId}/restore")->assertOk();
        $this->assertEquals(TaskPost::STATUS_OPEN, TaskPost::find($taskId)->status);
    }

    public function test_fraud_scan_flags_duplicate_text_and_decide(): void
    {
        $category = $this->createCategory();
        $spammer = $this->actingAsUser();

        for ($i = 0; $i < 3; $i++) {
            $this->postJson('/api/need-requests', [
                'title' => 'Identical spam request',
                'description' => 'Word-for-word copy paste flooding.',
                'category_id' => $category->id,
                'budget_min' => 50,
                'budget_max' => 100,
            ])->assertStatus(201);
        }

        $this->actingAsUser('needs_admin');

        $scan = $this->postJson('/api/admin/needs/fraud-scan')->assertOk();
        $this->assertGreaterThanOrEqual(1, $scan->json('data.flagged'));

        $flags = $this->getJson('/api/admin/needs/fraud-flags?rule=duplicate_text&status=open')
            ->assertOk()
            ->json('data');
        $this->assertNotEmpty($flags);
        $flagId = $flags[0]['id'];

        $this->postJson("/api/admin/needs/fraud-flags/{$flagId}/decide", [
            'decision' => 'dismiss',
            'note' => 'Reviewed: legitimate bulk posting.',
        ])->assertOk();

        $this->assertEquals(FraudFlag::STATUS_DISMISSED, FraudFlag::find($flagId)->status);

        // Decided flags cannot be decided twice.
        $this->postJson("/api/admin/needs/fraud-flags/{$flagId}/decide", [
            'decision' => 'confirm',
        ])->assertStatus(422);
    }

    public function test_needs_dispute_queue_excludes_order_disputes_and_resolves(): void
    {
        $request = $this->createRequest();

        $orderDispute = Dispute::create([
            'user_id' => $request->user_id,
            'order_id' => null,
            'subject' => 'Order arrived damaged',
            'description' => 'Order-scope case must stay out of the needs queue.',
            'status' => 'open',
        ]);

        $needsDispute = Dispute::create([
            'user_id' => $request->user_id,
            'need_request_id' => $request->id,
            'subject' => 'Provider never showed up',
            'description' => 'Needs-scope case for the console.',
            'status' => 'open',
        ]);

        $this->actingAsUser('needs_admin');

        $list = $this->getJson('/api/admin/needs/disputes')->assertOk();
        $list->assertJsonFragment(['id' => $needsDispute->id]);
        $list->assertJsonMissing(['id' => $orderDispute->id]);

        $this->postJson("/api/admin/needs/disputes/{$needsDispute->id}/resolve", [
            'resolution' => 'dismissed',
            'resolution_notes' => 'No-show claim unsubstantiated.',
        ])->assertOk();

        $this->assertEquals('resolved', $needsDispute->fresh()->status);
        $this->assertDatabaseHas('need_request_events', [
            'need_request_id' => $request->id,
            'action' => 'dispute_resolved',
        ]);
    }

    public function test_owner_can_file_needs_scoped_dispute(): void
    {
        $category = $this->createCategory();
        $owner = $this->actingAsUser();

        $request = NeedRequest::create([
            'user_id' => $owner->id,
            'category_id' => $category->id,
            'request_number' => 'REQ-' . strtoupper(uniqid()),
            'title' => 'Fix leaking tap',
            'description' => 'Kitchen tap leaks constantly.',
            'budget_max' => 60,
            'status' => NeedRequest::STATUS_IN_PROGRESS,
        ]);

        $filed = $this->postJson('/api/disputes', [
            'need_request_id' => $request->id,
            'subject' => 'Work stalled halfway',
            'description' => 'Provider stopped responding mid-job.',
        ])->assertStatus(201);
        $this->assertEquals($request->id, $filed->json('data.need_request_id'));

        // Strangers cannot dispute other people's requests.
        $this->actingAsUser();
        $this->postJson('/api/disputes', [
            'need_request_id' => $request->id,
            'subject' => 'Hijack attempt',
            'description' => 'Not my request.',
        ])->assertStatus(403);
    }

    public function test_overview_reports_live_attention_counts(): void
    {
        $this->createRequest();

        $this->actingAsUser('needs_admin');

        $overview = $this->getJson('/api/admin/needs/overview')->assertOk()->json('data');

        $this->assertArrayHasKey('attention', $overview);
        $this->assertArrayHasKey('requests_by_status', $overview);
        $this->assertGreaterThanOrEqual(1, $overview['attention']['requests_pending']);
        $this->assertGreaterThanOrEqual(1, $overview['requests_by_status']['pending'] ?? 0);

        // Customers cannot see the operational overview.
        $this->actingAsUser();
        $this->getJson('/api/admin/needs/overview')->assertStatus(403);
    }

    public function test_requests_index_filters_by_category(): void
    {
        $request = $this->createRequest();

        $this->actingAsUser('needs_admin');

        $this->getJson('/api/admin/needs/requests?category_id=' . $request->category_id)
            ->assertOk()
            ->assertJsonFragment(['id' => $request->id]);

        $this->getJson('/api/admin/needs/requests?category_id=' . (string) \Illuminate\Support\Str::uuid())
            ->assertOk()
            ->assertJsonMissing(['id' => $request->id]);
    }

    public function test_reports_match_records_and_export_is_audited(): void
    {
        $request = $this->createRequest();

        $this->actingAsUser('needs_admin');

        $report = $this->getJson('/api/admin/needs/reports/requests')->assertOk()->json('data');
        $this->assertGreaterThanOrEqual(1, $report['requests_total']);
        $this->assertGreaterThanOrEqual(1, $report['volume_by_status']['pending'] ?? 0);
        // N-28 response SLA keys ship with the report even before any
        // offer exists (median is null on an empty sample, never absent).
        $this->assertArrayHasKey('first_response_median_hours', $report);
        $this->assertArrayHasKey('first_response_sample', $report);
        $this->assertNull($report['first_response_median_hours']);

        $csv = $this->getJson('/api/admin/needs/reports/requests/export')->assertOk();
        $body = $csv->streamedContent();
        $this->assertStringContainsString($request->request_number, $body);
        // Privacy: opaque owner reference, never contact PII.
        $ownerEmail = $request->fresh()->user->email;
        $this->assertStringNotContainsString($ownerEmail, $body);

        $this->assertDatabaseHas('audit_logs', ['action' => 'needs.requests.export']);

        // View-only triage has no report access.
        $this->actingAsUser('needs_viewer');
        $this->getJson('/api/admin/needs/reports/requests')->assertStatus(403);
        $this->getJson('/api/admin/needs/reports/requests/export')->assertStatus(403);
    }

    /**
     * N-28 response SLA: request created 3h ago, provider answers after
     * 2h → both the request report and the provider detail report the
     * 2.0h first-response time, and only the provider's FIRST offer on a
     * request counts.
     */
    public function test_first_response_sla_shows_in_report_and_provider_detail(): void
    {
        $request = $this->createRequest();
        $provider = $this->actingAsUser();
        NeedProviderProfile::create([
            'user_id' => $provider->id,
            'display_name' => 'Fast Responder',
            'category_ids' => [],
            'service_areas' => [],
            'status' => NeedProviderProfile::STATUS_APPROVED,
        ]);

        \Illuminate\Support\Facades\DB::table('need_requests')
            ->where('id', $request->id)
            ->update(['created_at' => now()->subHours(3)]);

        $this->actingAs($provider, 'sanctum')
            ->postJson("/api/need-requests/{$request->id}/offers", [
                'price' => 120,
                'message' => 'I can start today.',
            ])
            ->assertStatus(201);

        \Illuminate\Support\Facades\DB::table('need_offers')
            ->where('need_request_id', $request->id)
            ->where('provider_id', $provider->id)
            ->update(['created_at' => now()->subHours(1)]);

        // A second provider answers instantly (request is 3h old) — their
        // own detail shows a 3h first response while the request report
        // keeps counting the earlier 2h offer as THE first response.
        $other = $this->actingAsUser();
        NeedProviderProfile::create([
            'user_id' => $other->id,
            'display_name' => 'Slow Responder',
            'category_ids' => [],
            'service_areas' => [],
            'status' => NeedProviderProfile::STATUS_APPROVED,
        ]);
        $this->actingAs($other, 'sanctum')
            ->postJson("/api/need-requests/{$request->id}/offers", [
                'price' => 95,
                'message' => 'Here now.',
            ])
            ->assertStatus(201);

        $this->actingAsUser('needs_admin');

        $report = $this->getJson('/api/admin/needs/reports/requests')->assertOk()->json('data');
        // Report samples are REQUESTS: this one request's first offer
        // arrived 2h after creation (the 3h-old second offer is later).
        $this->assertEqualsWithDelta(2.0, (float) $report['first_response_median_hours'], 0.1);
        $this->assertSame(1, $report['first_response_sample']);

        $profileId = NeedProviderProfile::where('user_id', $provider->id)->value('id');
        $detail = $this->getJson("/api/admin/needs/providers/{$profileId}")
            ->assertOk()
            ->json('data.first_response');
        $this->assertSame(1, $detail['responded_requests']);
        $this->assertEqualsWithDelta(2.0, (float) $detail['median_hours'], 0.1);
        $this->assertEqualsWithDelta(2.0, (float) $detail['fastest_hours'], 0.1);

        $otherProfileId = NeedProviderProfile::where('user_id', $other->id)->value('id');
        $otherDetail = $this->getJson("/api/admin/needs/providers/{$otherProfileId}")
            ->assertOk()
            ->json('data.first_response');
        $this->assertSame(1, $otherDetail['responded_requests']);
        $this->assertEqualsWithDelta(3.0, (float) $otherDetail['median_hours'], 0.1);
    }
}
