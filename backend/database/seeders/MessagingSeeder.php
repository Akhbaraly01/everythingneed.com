<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Modules\Messaging\Entities\ChatConversation;
use Modules\Messaging\Entities\ChatMessage;

class MessagingSeeder extends Seeder
{
    public function run(): void
    {
        $customer = User::where('email', 'user@everythingneed.com')->first();
        $workerUser = User::where('email', 'daniel.worker@everythingneed.com')->first();

        if (!$customer || !$workerUser) {
            return;
        }

        $existing = ChatConversation::where('customer_id', $customer->id)
            ->where('worker_id', $workerUser->id)
            ->first();

        if ($existing) {
            return;
        }

        $conversation = ChatConversation::create([
            'customer_id' => $customer->id,
            'worker_id' => $workerUser->id,
        ]);

        $messages = [
            [$customer->id, 'Hi Daniel! Are you available this Saturday for a socket installation?', true],
            [$workerUser->id, 'Hello! Yes, I have a free slot around 10am. What is the address?', false],
            [$customer->id, 'East Legon, near the mall. Two double sockets in the kitchen.', true],
            [$workerUser->id, 'Noted — standard rate applies. I will bring the materials. See you Saturday 10am!', false],
        ];

        foreach ($messages as $i => [$senderId, $text, $read]) {
            ChatMessage::create([
                'conversation_id' => $conversation->id,
                'sender_id' => $senderId,
                'message' => $text,
                'message_type' => 'text',
                'is_read' => $read || $i < count($messages) - 2,
                'created_at' => now()->subMinutes(count($messages) - $i),
            ]);
        }

        $conversation->touch();
    }
}
