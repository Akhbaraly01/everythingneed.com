<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Modules\Messaging\Entities\ChatConversation;
use Modules\Messaging\Entities\ChatMessage;
use Tests\TestCase;

class AdminMessagingConsoleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        Cache::forget('rbac.matrix');
    }

    private function conversation(): array
    {
        $customer = User::factory()->create(['name' => 'Chat Customer']);
        $worker = User::factory()->create(['name' => 'Chat Worker']);

        $conversation = ChatConversation::create([
            'customer_id' => $customer->id,
            'worker_id' => $worker->id,
        ]);

        $message = ChatMessage::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $customer->id,
            'message' => 'Is the job still available?',
            'message_type' => 'text',
            'is_read' => false,
            'created_at' => now(),
        ]);

        return [$conversation, $message];
    }

    public function test_support_agent_can_read_but_not_remove_conversations(): void
    {
        [$conversation] = $this->conversation();

        $this->actingAsUser('support_agent');

        $this->getJson('/api/admin/messaging/conversations?search=Chat')
            ->assertOk()
            ->assertJsonFragment(['id' => $conversation->id]);

        $this->getJson("/api/admin/messaging/conversations/{$conversation->id}")
            ->assertOk()
            ->assertJsonPath('data.messages.0.message', 'Is the job still available?');

        $this->deleteJson("/api/admin/messaging/conversations/{$conversation->id}")
            ->assertStatus(403);
    }

    public function test_support_admin_soft_deletes_and_restores_a_conversation(): void
    {
        [$conversation] = $this->conversation();

        $this->actingAsUser('support_admin');

        $this->deleteJson("/api/admin/messaging/conversations/{$conversation->id}")
            ->assertOk();
        $this->assertSoftDeleted('chat_conversations', ['id' => $conversation->id]);

        $this->getJson('/api/admin/messaging/conversations?status=removed')
            ->assertOk()
            ->assertJsonFragment(['id' => $conversation->id]);

        $this->postJson("/api/admin/messaging/conversations/{$conversation->id}/restore")
            ->assertOk();
        $this->assertDatabaseHas('chat_conversations', [
            'id' => $conversation->id,
            'deleted_at' => null,
        ]);
    }

    public function test_support_admin_soft_deletes_a_message(): void
    {
        [$conversation, $message] = $this->conversation();

        $this->actingAsUser('support_admin');

        $this->deleteJson("/api/admin/messaging/messages/{$message->id}")
            ->assertOk();
        $this->assertSoftDeleted('chat_messages', ['id' => $message->id]);

        $this->getJson("/api/admin/messaging/conversations/{$conversation->id}")
            ->assertOk()
            ->assertJsonPath('data.messages.0.id', $message->id)
            ->assertJsonPath('data.messages.0.deleted_at', fn ($value) => $value !== null);
    }

    public function test_plain_user_is_forbidden(): void
    {
        $this->actingAsUser();

        $this->getJson('/api/admin/messaging/conversations')->assertStatus(403);
    }
}
