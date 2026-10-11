<?php

namespace Tests\Feature\Security;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * W0 hardening: the table gateway must expose a per-table write
 * allowlist policy — clients can only write their own content and
 * preferences, never state-machine fields, money, counters, ownership
 * or verification state.
 */
class TableGatewayWritePolicyTest extends TestCase
{
    // ── Read-only tables (mutations belong to module REST) ─────────

    public function test_medicine_orders_are_read_only_through_gateway(): void
    {
        $user = $this->actingAsUser();
        $id = (string) Str::uuid();
        DB::table('medicine_orders')->insert([
            'id' => $id,
            'user_id' => $user->id,
            'order_number' => 'MO-TAMPER-1',
            'delivery_address' => '1 Old Rd',
            'total_amount' => 50,
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Amount + status tampering blocked entirely (read-only table).
        $this->actingAs($user, 'sanctum')
            ->putJson("/api/db/medicine_orders/{$id}", ['total_amount' => 0.01, 'status' => 'delivered'])
            ->assertStatus(405);

        $row = DB::table('medicine_orders')->where('id', $id)->first();
        $this->assertSame('50.00', (string) $row->total_amount);
        $this->assertSame('pending', $row->status);
    }

    public function test_prescriptions_are_read_only_through_gateway(): void
    {
        $user = $this->actingAsUser();
        $id = (string) Str::uuid();
        DB::table('prescriptions')->insert([
            'id' => $id,
            'code' => 'RX-GW-POLICY',
            'patient_id' => $user->id,
            'items' => json_encode([['name' => 'Drug']]),
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($user, 'sanctum')
            ->putJson("/api/db/prescriptions/{$id}", ['status' => 'dispensed'])
            ->assertStatus(405);

        $this->assertSame('active', DB::table('prescriptions')->where('id', $id)->value('status'));
    }

    // ── Enrollment completion forgery (certificate bypass) ─────────

    public function test_gateway_blocks_enrollment_completion_forgery(): void
    {
        $user = $this->actingAsUser();
        $id = (string) Str::uuid();
        DB::table('enrollments')->insert([
            'id' => $id,
            'user_id' => $user->id,
            'course_id' => (string) Str::uuid(),
            'progress' => 10,
        ]);

        // enrollments is read-only through the gateway (mutations belong to
        // LearnService / CompleteLesson): progress / completed_at cannot be
        // faked, so IssueCertificate's progress check cannot be bypassed.
        $this->actingAs($user, 'sanctum')
            ->putJson("/api/db/enrollments/{$id}", ['progress' => 100, 'completed_at' => now()->toIso8601String()])
            ->assertStatus(405);

        $row = DB::table('enrollments')->where('id', $id)->first();
        $this->assertSame(10, (int) $row->progress);
        $this->assertNull($row->completed_at);
    }

    public function test_gateway_blocks_enrollment_insert_bypassing_the_paid_enroll_endpoint(): void
    {
        $user = $this->actingAsUser();
        $courseId = (string) Str::uuid();

        // A gateway insert would create an enrollment without LearnService
        // ever charging a paid course - the table is read-only here.
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/db/enrollments', [
                'course_id' => $courseId,
                'progress' => 100,
                'completed_at' => now()->toIso8601String(),
            ])
            ->assertStatus(405);

        $this->assertSame(
            0,
            DB::table('enrollments')->where('user_id', $user->id)->where('course_id', $courseId)->count(),
            'no enrollment row may be created outside POST /api/courses/{id}/enroll'
        );
    }

    public function test_gateway_blocks_video_progress_completion_forgery(): void
    {
        $user = $this->actingAsUser();
        $id = (string) Str::uuid();
        DB::table('video_progress')->insert([
            'id' => $id,
            'user_id' => $user->id,
            'course_id' => (string) Str::uuid(),
            'lesson_id' => (string) Str::uuid(),
            'progress_percent' => 10,
            'completed' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // video_progress is server-owned: CompleteLesson recounts
        // `completed = true` rows into enrollments.progress, so flipping
        // `completed` here would be a direct certificate forgery path.
        $this->actingAs($user, 'sanctum')
            ->putJson("/api/db/video_progress/{$id}", ['completed' => true, 'progress_percent' => 100])
            ->assertStatus(405);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/db/video_progress', [
                'course_id' => (string) Str::uuid(),
                'lesson_id' => (string) Str::uuid(),
                'completed' => true,
            ])
            ->assertStatus(405);

        $row = DB::table('video_progress')->where('id', $id)->first();
        $this->assertFalse((bool) $row->completed);
        $this->assertSame(10, (int) $row->progress_percent);
    }

    // ── Health tickets: status machine + self-cancel ────────────────

    public function test_gateway_blocks_health_ticket_status_flip_but_allows_self_cancel(): void
    {
        $patient = $this->actingAsUser();
        $id = (string) Str::uuid();
        DB::table('health_tickets')->insert([
            'id' => $id,
            'patient_id' => $patient->id,
            'ticket_number' => 'HT-GW-POLICY',
            'symptoms' => 'cough',
            'status' => 'assigned',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // (a) Status flip attempt only => no writable field => 422.
        $this->actingAs($patient, 'sanctum')
            ->putJson("/api/db/health_tickets/{$id}", ['status' => 'completed'])
            ->assertStatus(422);
        $this->assertSame('assigned', DB::table('health_tickets')->where('id', $id)->value('status'));

        // (b) Status smuggled alongside a content edit => content sticks,
        //     illegal status value stripped.
        $this->actingAs($patient, 'sanctum')
            ->putJson("/api/db/health_tickets/{$id}", ['symptoms' => 'cough, fever', 'status' => 'completed'])
            ->assertOk();
        $row = DB::table('health_tickets')->where('id', $id)->first();
        $this->assertSame('cough, fever', $row->symptoms);
        $this->assertSame('assigned', $row->status, 'status must be stripped on disallowed value');

        // (c) Self-cancel is the one permitted transition.
        $this->actingAs($patient, 'sanctum')
            ->putJson("/api/db/health_tickets/{$id}", ['status' => 'cancelled'])
            ->assertOk();
        $this->assertSame('cancelled', DB::table('health_tickets')->where('id', $id)->value('status'));

        // (d) Money field is never updatable through the gateway.
        $this->actingAs($patient, 'sanctum')
            ->putJson("/api/db/health_tickets/{$id}", ['consultation_fee' => 0])
            ->assertStatus(422);
    }

    public function test_gateway_strips_status_on_health_ticket_insert(): void
    {
        $patient = $this->actingAsUser();

        $res = $this->actingAs($patient, 'sanctum')
            ->postJson('/api/db/health_tickets', [
                'ticket_number' => 'HT-GW-INSERT-1',
                'symptoms' => 'headache',
                'status' => 'completed',           // must be stripped
                'doctor_id' => (string) Str::uuid(), // legitimate booking field
            ]);

        $res->assertCreated();
        $row = DB::table('health_tickets')->where('id', $res->json('data.id'))->first();
        $this->assertSame('pending', $row->status, 'DB default applies — client cannot pick insert status');
        $this->assertSame($patient->id, $row->patient_id, 'ownership forced server-side');
    }

    // ── Learn posts: counters / featured / status ───────────────────

    public function test_gateway_blocks_learn_post_counter_and_status_tampering(): void
    {
        $user = $this->actingAsUser();
        $id = (string) Str::uuid();
        DB::table('learn_posts')->insert([
            'id' => $id,
            'user_id' => $user->id,
            'title' => 'Original',
            'content' => 'Body',
            'category' => 'general',
            'likes_count' => 3,
            'comments_count' => 1,
            'status' => 'published',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($user, 'sanctum')
            ->putJson("/api/db/learn_posts/{$id}", [
                'title' => 'Renamed',
                'likes_count' => 99999,
                'comments_count' => 0,
                'is_featured' => true,
                'status' => 'published',
            ])
            ->assertOk();

        $row = DB::table('learn_posts')->where('id', $id)->first();
        $this->assertSame('Renamed', $row->title, 'legitimate content write must succeed');
        $this->assertSame(3, (int) $row->likes_count, 'counters are server-owned');
        $this->assertSame(1, (int) $row->comments_count);
        $this->assertNotTrue((bool) $row->is_featured, 'featuring is a moderator action');
    }

    // ── Legitimate flows keep working ───────────────────────────────

    public function test_gateway_allows_legitimate_content_writes(): void
    {
        $user = $this->actingAsUser();

        // User settings value edit (key is create-only identity).
        $settingsId = (string) Str::uuid();
        DB::table('user_settings')->insert([
            'id' => $settingsId,
            'user_id' => $user->id,
            'key' => 'theme',
            'value' => json_encode(['mode' => 'light']),
        ]);
        $this->actingAs($user, 'sanctum')
            ->putJson("/api/db/user_settings/{$settingsId}", ['value' => json_encode(['mode' => 'dark']), 'key' => 'renamed'])
            ->assertOk();
        $settings = DB::table('user_settings')->where('id', $settingsId)->first();
        $this->assertSame('theme', $settings->key, 'row identity key is immutable');
        $this->assertSame(['mode' => 'dark'], json_decode($settings->value, true));

        // Completion tables stay readable through the gateway (scoped to
        // their owner) - only the writes are locked down.
        $id = (string) Str::uuid();
        DB::table('video_progress')->insert([
            'id' => $id,
            'user_id' => $user->id,
            'course_id' => (string) Str::uuid(),
            'lesson_id' => (string) Str::uuid(),
            'progress_percent' => 10,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $read = $this->actingAs($user, 'sanctum')->getJson('/api/db/video_progress')->assertOk();
        $this->assertContains(
            $id,
            collect($read->json('data'))->pluck('id')->all(),
            'own video_progress rows must remain readable'
        );
    }
}
