<?php

namespace Tests\Feature\Messaging;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Messaging\Entities\ChatConversation;
use Modules\Messaging\Entities\ChatMessage;
use Tests\TestCase;

class ChatTest extends TestCase
{
    use RefreshDatabase;

    public function test_users_can_converse_with_read_receipts_and_guards(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();
        $stranger = User::factory()->create();

        // Find-or-create is idempotent
        $first = $this->actingAs($alice)->postJson('/api/chat/conversations', ['recipient_id' => $bob->id]);
        $first->assertStatus(201);
        $conversationId = $first->json('data.id');

        $second = $this->actingAs($bob)->postJson('/api/chat/conversations', ['recipient_id' => $alice->id]);
        $second->assertStatus(201);
        $this->assertEquals($conversationId, $second->json('data.id'));

        // Bob sends; Alice sees unread
        $this->actingAs($bob)->postJson("/api/chat/{$conversationId}/messages", ['message' => 'Hello Alice!'])
            ->assertStatus(201);
        $this->actingAs($bob)->postJson("/api/chat/{$conversationId}/messages", ['message' => 'Second message'])
            ->assertStatus(201);

        $unread = ChatMessage::where('conversation_id', $conversationId)
            ->where('is_read', false)->count();
        $this->assertEquals(2, $unread);

        // Stranger cannot read the thread
        $this->actingAs($stranger)
            ->getJson("/api/chat/{$conversationId}/messages")
            ->assertStatus(403);

        // Alice opens thread — marks incoming as read
        $thread = $this->actingAs($alice)->getJson("/api/chat/{$conversationId}/messages");
        $thread->assertStatus(200);
        $this->assertCount(2, $thread->json('data'));

        $unreadAfter = ChatMessage::where('conversation_id', $conversationId)
            ->where('is_read', false)->count();
        $this->assertEquals(0, $unreadAfter);

        // Alice replies
        $reply = $this->actingAs($alice)->postJson("/api/chat/{$conversationId}/messages", ['message' => 'Hi Bob 👋']);
        $reply->assertStatus(201);

        // Empty message rejected
        $this->actingAs($alice)->postJson("/api/chat/{$conversationId}/messages", ['message' => ''])
            ->assertStatus(422);
    }

    public function test_user_search_excludes_self(): void
    {
        $alice = User::factory()->create(['name' => 'Alice Search']);
        User::factory()->create(['name' => 'Bob Target']);
        User::factory()->create(['name' => 'Alice Clone']);

        $results = $this->actingAs($alice)->getJson('/api/chat/users?q=al');
        $results->assertStatus(200);

        $ids = collect($results->json('data'))->pluck('id');
        $this->assertFalse($ids->contains($alice->id));
        $this->assertTrue($ids->contains(User::where('name', 'Alice Clone')->first()->id));
    }

    public function test_customer_service_can_moderate_any_thread(): void
    {
        $alice = User::factory()->create();
        $agent = User::factory()->create();
        \App\Models\UserRole::create(['user_id' => $agent->id, 'role' => 'customer_service']);

        $conversationId = $this->actingAs($alice)
            ->postJson('/api/chat/conversations', ['recipient_id' => User::factory()->create()->id])
            ->json('data.id');

        ChatMessage::create([
            'conversation_id' => $conversationId,
            'sender_id' => $alice->id,
            'message' => 'Need help with a dispute.',
            'message_type' => 'text',
            'is_read' => false,
            'created_at' => now(),
        ]);

        $this->actingAs($agent)
            ->getJson("/api/chat/{$conversationId}/messages")
            ->assertStatus(200);
    }
}
