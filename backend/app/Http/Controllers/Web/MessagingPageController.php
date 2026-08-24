<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Messaging\Entities\ChatConversation;
use Modules\Messaging\Entities\ChatMessage;

class MessagingPageController extends Controller
{
    public function inbox(Request $request): Response
    {
        $conversations = ChatConversation::where('customer_id', $request->user()->id)
            ->orWhere('worker_id', $request->user()->id)
            ->with(['customer:id,name,email', 'worker:id,name,email'])
            ->orderByDesc('updated_at')
            ->get()
            ->map(function ($conversation) use ($request) {
                // Attach last message + unread count per conversation
                $last = ChatMessage::where('conversation_id', $conversation->id)
                    ->orderByDesc('created_at')->first();
                $unread = ChatMessage::where('conversation_id', $conversation->id)
                    ->where('sender_id', '!=', $request->user()->id)
                    ->where('is_read', false)->count();

                return [
                    'id' => $conversation->id,
                    'customer' => $conversation->customer?->only(['id', 'name', 'email']),
                    'worker' => $conversation->worker?->only(['id', 'name', 'email']),
                    'last_message' => $last ? ['message' => $last->message, 'sender_id' => $last->sender_id, 'created_at' => $last->created_at?->toISOString()] : null,
                    'unread_count' => $unread,
                    'updated_at' => $conversation->updated_at?->toISOString(),
                ];
            });

        return Inertia::render('messages/Index', [
            'conversations' => $conversations,
        ]);
    }

    public function thread(Request $request, string $id): Response
    {
        $conversation = ChatConversation::with(['customer:id,name,email', 'worker:id,name,email'])
            ->findOrFail($id);

        $userId = $request->user()->id;
        abort_unless(
            in_array($userId, [$conversation->customer_id, $conversation->worker_id], true),
            403,
            'You are not a participant in this conversation.'
        );

        $messages = ChatMessage::where('conversation_id', $id)
            ->orderBy('created_at')
            ->limit(200)->get()
            ->map(fn ($m) => $this->presentMessage($m, $userId));

        // Opening the thread marks incoming messages as read
        ChatMessage::where('conversation_id', $id)
            ->where('sender_id', '!=', $userId)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return Inertia::render('messages/Show', [
            'conversation' => [
                'id' => $conversation->id,
                'customer' => $conversation->customer?->only(['id', 'name', 'email']),
                'worker' => $conversation->worker?->only(['id', 'name', 'email']),
            ],
            'initialMessages' => $messages,
        ]);
    }

    private function presentMessage(ChatMessage $m, string $viewerId): array
    {
        return [
            'id' => $m->id,
            'sender_id' => $m->sender_id,
            'mine' => (string) $m->sender_id === (string) $viewerId,
            'message' => $m->message,
            'message_type' => $m->message_type,
            'created_at' => $m->created_at?->toISOString(),
        ];
    }
}
