<?php

namespace Tests\Feature\WaveO;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Modules\Messaging\Entities\Ticket;
use Modules\Reviews\Entities\Review;
use Modules\Reviews\Entities\ReviewVote;
use Tests\TestCase;

/**
 * Wave O (spec 50 notifications / 51 messaging / 52 reviews / 62 support):
 * notification filters + unread badge, transactional fan-out, review vote
 * counting, review write throttling, conversation guard rails, ticket
 * attachment scoping, and role-gated staff ticket detail.
 */
class WaveOMessagingTest extends TestCase
{
    private function notifyRow(string $userId, string $type, bool $read, string $title): string
    {
        $id = (string) Str::uuid();
        DB::table('notifications')->insert([
            'id' => $id,
            'user_id' => $userId,
            'title' => $title,
            'message' => 'Message body for testing',
            'type' => $type,
            'related_id' => null,
            'is_read' => $read,
            'created_at' => now(),
        ]);

        return $id;
    }

    public function test_notification_index_filters_by_type_and_read_state(): void
    {
        $me = $this->createUser();
        $this->notifyRow($me->id, 'wallet', false, 'Deposit');
        $this->notifyRow($me->id, 'wallet', true, 'Old deposit');
        $this->notifyRow($me->id, 'general', false, 'Newsletter');
        $other = $this->createUser();
        $this->notifyRow($other->id, 'wallet', false, 'Not mine');

        $wallet = $this->actingAs($me, 'sanctum')
            ->getJson('/api/notifications?type=wallet')
            ->assertOk();
        $this->assertEquals(2, $wallet->json('meta.total'));
        $titles = array_column($wallet->json('data'), 'title');
        $this->assertContains('Deposit', $titles);
        $this->assertNotContains('Newsletter', $titles);

        $unread = $this->actingAs($me, 'sanctum')
            ->getJson('/api/notifications?is_read=false')
            ->assertOk();
        $this->assertEquals(2, $unread->json('meta.total'));
        foreach ($unread->json('data') as $row) {
            $this->assertFalse((bool) $row['is_read']);
        }

        $combined = $this->actingAs($me, 'sanctum')
            ->getJson('/api/notifications?type=wallet&is_read=false')
            ->assertOk();
        $this->assertEquals(1, $combined->json('meta.total'));
        $this->assertEquals('Deposit', $combined->json('data.0.title'));
    }

    public function test_unread_count_counts_only_own_unread_rows(): void
    {
        $this->getJson('/api/notifications/unread-count')->assertUnauthorized();

        $me = $this->createUser();
        $this->notifyRow($me->id, 'wallet', false, 'a');
        $this->notifyRow($me->id, 'wallet', false, 'b');
        $this->notifyRow($me->id, 'general', true, 'c');
        $other = $this->createUser();
        $this->notifyRow($other->id, 'wallet', false, 'theirs');

        $res = $this->actingAs($me, 'sanctum')
            ->getJson('/api/notifications/unread-count')
            ->assertOk();

        $this->assertEquals(2, $res->json('data.unread'));
    }

    public function test_wallet_deposit_fans_out_a_notification_row(): void
    {
        $user = $this->createUser();

        app(\Modules\Wallet\Services\WalletService::class)
            ->deposit($user->id, 25.5, 'card', 'waveo-fanout-1');

        $row = DB::table('notifications')
            ->where('user_id', $user->id)
            ->where('type', 'wallet')
            ->first();

        $this->assertNotNull($row);
        $this->assertStringContainsString('Wallet deposit received', $row->title);
        $this->assertFalse((bool) $row->is_read);
        $this->assertLessThanOrEqual(500, strlen($row->message));
    }

    public function test_review_votes_are_one_per_user_and_counted_server_side(): void
    {
        $author = $this->createUser();
        $review = Review::create([
            'user_id' => $author->id,
            'reviewable_type' => 'product',
            'reviewable_id' => (string) Str::uuid(),
            'rating' => 5,
            'comment' => 'Solid product',
        ]);

        $voter = $this->createUser();
        $this->actingAs($voter, 'sanctum')
            ->postJson("/api/reviews/{$review->id}/vote", ['is_helpful' => true])
            ->assertOk()
            ->assertJsonPath('data.helpful_count', 1);

        // Re-voting updates the same row instead of adding a duplicate.
        $this->actingAs($voter, 'sanctum')
            ->postJson("/api/reviews/{$review->id}/vote", ['is_helpful' => false])
            ->assertOk()
            ->assertJsonPath('data.helpful_count', 0);

        $this->assertEquals(1, ReviewVote::where('review_id', $review->id)->count());

        $second = $this->createUser();
        $this->actingAs($second, 'sanctum')
            ->postJson("/api/reviews/{$review->id}/vote", ['is_helpful' => true])
            ->assertOk()
            ->assertJsonPath('data.helpful_count', 1);

        $this->actingAs($voter, 'sanctum')
            ->postJson('/api/reviews/'.Str::uuid().'/vote', ['is_helpful' => true])
            ->assertNotFound();

        $this->actingAs($voter, 'sanctum')
            ->postJson("/api/reviews/{$review->id}/vote", ['is_helpful' => 'maybe'])
            ->assertStatus(422);
    }

    public function test_review_post_flood_hits_the_route_rate_limit(): void
    {
        $user = $this->createUser();

        for ($i = 0; $i < 30; $i++) {
            $this->actingAs($user, 'sanctum')->postJson('/api/reviews', [
                'reviewable_type' => 'product',
                'reviewable_id' => (string) Str::uuid(),
                'rating' => 4,
                'comment' => 'Acceptable',
            ])->assertStatus(201);
        }

        $this->actingAs($user, 'sanctum')->postJson('/api/reviews', [
            'reviewable_type' => 'product',
            'reviewable_id' => (string) Str::uuid(),
            'rating' => 4,
            'comment' => 'Blocked',
        ])->assertStatus(429);
    }

    public function test_self_conversation_is_rejected(): void
    {
        $user = $this->createUser();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/chat/conversations', ['recipient_id' => $user->id])
            ->assertStatus(422)
            ->assertJsonFragment(['message' => 'You cannot start a conversation with yourself']);
    }

    public function test_conversation_thread_is_participant_only(): void
    {
        $a = $this->createUser();
        $b = $this->createUser();
        $stranger = $this->createUser();

        $conversation = $this->actingAs($a, 'sanctum')
            ->postJson('/api/chat/conversations', ['recipient_id' => $b->id])
            ->assertStatus(201)
            ->json('data.id');

        $this->actingAs($a, 'sanctum')
            ->postJson("/api/chat/{$conversation}/messages", ['message' => 'Hello there'])
            ->assertStatus(201);

        $this->actingAs($b, 'sanctum')
            ->getJson("/api/chat/{$conversation}/messages")
            ->assertOk()
            ->assertJsonFragment(['message' => 'Hello there']);

        $this->actingAs($stranger, 'sanctum')
            ->getJson("/api/chat/{$conversation}/messages")
            ->assertStatus(403);
        $this->actingAs($stranger, 'sanctum')
            ->postJson("/api/chat/{$conversation}/messages", ['message' => 'Intruder'])
            ->assertStatus(403);
    }

    public function test_ticket_attachments_must_come_from_the_uploader(): void
    {
        $user = $this->createUser();
        $valid = "uploads/u/{$user->id}/ticket-attachments/photo.png";

        $this->actingAs($user, 'sanctum')->postJson('/api/tickets', [
            'subject' => 'Broken parcel',
            'message' => 'The box arrived crushed.',
            'attachments' => ['/etc/passwd', 'uploads/u/'.Str::uuid().'/ticket-attachments/evil.png'],
        ])->assertStatus(422);

        $ticketId = $this->actingAs($user, 'sanctum')->postJson('/api/tickets', [
            'subject' => 'Broken parcel',
            'message' => 'The box arrived crushed.',
            'attachments' => [$valid],
        ])
            ->assertStatus(201)
            ->assertJsonPath('data.attachments.0', $valid)
            ->json('data.id');

        // A reply may not smuggle a foreign path either.
        $this->actingAs($user, 'sanctum')->postJson("/api/tickets/{$ticketId}/reply", [
            'message' => 'Here is the label',
            'attachments' => ['/etc/shadow'],
        ])->assertStatus(422);

        $this->actingAs($user, 'sanctum')->postJson("/api/tickets/{$ticketId}/reply", [
            'message' => 'Here is the label',
            'attachments' => [$valid],
        ])->assertStatus(201);

        $stored = DB::table('ticket_messages')
            ->where('ticket_id', $ticketId)
            ->where('message', 'Here is the label')
            ->value('attachments');
        $this->assertSame([$valid], json_decode((string) $stored, true));
    }

    public function test_admin_support_detail_requires_the_support_role(): void
    {
        $customer = $this->createUser();
        $ticketId = $this->actingAs($customer, 'sanctum')
            ->postJson('/api/tickets', [
                'subject' => 'Refund pending',
                'message' => 'Still waiting on my refund.',
            ])
            ->assertStatus(201)
            ->json('data.id');

        $stranger = $this->createUser();
        $this->actingAs($stranger, 'sanctum')
            ->getJson("/api/admin/support/tickets/{$ticketId}")
            ->assertStatus(403);

        $agent = $this->createUser();
        $this->assignRole($agent, 'support_agent');
        $res = $this->actingAs($agent, 'sanctum')
            ->getJson("/api/admin/support/tickets/{$ticketId}")
            ->assertOk();

        $this->assertEquals($ticketId, $res->json('data.ticket.id'));
        $this->assertNotEmpty($res->json('data.ticket.user.id'));
        $this->assertIsArray($res->json('data.events'));
        $this->assertNotEmpty($res->json('data.events'));
    }

    public function test_ticket_owner_can_still_use_their_thread_endpoints(): void
    {
        $owner = $this->createUser();
        $ticket = Ticket::create([
            'user_id' => $owner->id,
            'ticket_number' => 'TKT-WAVEO-1',
            'subject' => 'Wave O regression',
            'description' => 'Ownership must hold',
            'priority' => 'low',
            'status' => 'open',
        ]);

        $stranger = $this->createUser();
        $this->actingAs($stranger, 'sanctum')->getJson("/api/tickets/{$ticket->id}")
            ->assertStatus(403);
        $this->actingAs($stranger, 'sanctum')
            ->postJson("/api/tickets/{$ticket->id}/reply", ['message' => 'hi'])
            ->assertStatus(403);

        $this->actingAs($owner, 'sanctum')->getJson("/api/tickets/{$ticket->id}")->assertOk();
    }

    public function test_support_pages_follow_spec_and_legacy_urls_still_render(): void
    {
        // Guests are bounced to login before anything renders.
        $this->get('/account/support')->assertRedirect();

        $user = $this->createUser();
        $this->actingAs($user, 'web')->get('/account/support')->assertOk();
        $this->actingAs($user, 'web')->get('/account/support/create')->assertOk();

        // Legacy /tickets URLs stay renderable (pinned WaveA regression net);
        // first-party navigation uses the spec-62 paths above.
        $this->actingAs($user, 'web')->get('/tickets')->assertOk();
        $this->actingAs($user, 'web')->get('/tickets/create')->assertOk();
    }

    public function test_admin_support_console_pages_are_role_gated(): void
    {
        // Console convention: plain users get the redirect+error web 403.
        $stranger = $this->createUser();
        $this->actingAs($stranger, 'web')->get('/admin/support')
            ->assertStatus(302)
            ->assertSessionHas('error');
        $this->actingAs($stranger, 'web')->get('/admin/support/'.Str::uuid())
            ->assertStatus(302)
            ->assertSessionHas('error');

        $agent = $this->createUser();
        $this->assignRole($agent, 'support_agent');
        $this->actingAs($agent, 'web')->get('/admin/support')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('admin/Support'));
        $this->actingAs($agent, 'web')->get('/admin/support/'.Str::uuid())
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('admin/SupportDetail'));
    }
}
