<?php

namespace Modules\Messaging\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Messaging\Entities\ChatConversation;
use Modules\Messaging\Entities\ChatMessage;
use Modules\Messaging\Events\ChatMessageSent;

class ChatController extends Controller
{
    public function conversations(Request $request): JsonResponse
    {
        $user = $request->user();

        $conversations = ChatConversation::where('customer_id', $user->id)
            ->orWhere('worker_id', $user->id)
            ->with(['customer', 'worker'])
            ->orderByDesc('updated_at')
            ->get()
            ->each(fn ($c) => $c->setAppends([]));

        return response()->json(['data' => $conversations]);
    }

    public function users(Request $request): JsonResponse
    {
        $q = trim((string) $request->query('q', ''));

        $query = \App\Models\User::query()
            ->select('id', 'name', 'email')
            ->where('id', '!=', $request->user()->id)
            ->limit(10);

        if ($q !== '') {
            $query->where(function ($sub) use ($q) {
                $sub->where('name', 'ilike', "%{$q}%")
                    ->orWhere('email', 'ilike', "%{$q}%");
            });
        }

        return response()->json(['data' => $query->get()]);
    }

    public function findOrCreate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'recipient_id' => 'nullable|uuid|exists:users,id',
            'booking_id' => 'nullable|uuid',
        ]);

        $user = $request->user();
        $recipientId = $validated['recipient_id'] ?? null;
        $bookingId = $validated['booking_id'] ?? null;

        if (!$recipientId && !$bookingId) {
            return response()->json(['message' => 'recipient_id or booking_id is required'], 422);
        }

        $query = ChatConversation::where(function ($q) use ($user, $recipientId, $bookingId) {
            $q->where('customer_id', $user->id)->where('worker_id', $recipientId);
            if ($bookingId) {
                $q->where('booking_id', $bookingId);
            } else {
                $q->whereNull('booking_id');
            }
        });

        $conversation = $query->first();

        if (!$conversation && $bookingId) {
            // Reverse pairing (worker started it)
            $conversation = ChatConversation::where('customer_id', $recipientId)
                ->where('worker_id', $user->id)
                ->where('booking_id', $bookingId)
                ->first();
        }

        if (!$conversation && $recipientId) {
            // Reverse direct-chat pairing (recipient started it first)
            $conversation = ChatConversation::where('customer_id', $recipientId)
                ->where('worker_id', $user->id)
                ->whereNull('booking_id')
                ->first();
        }

        if (!$conversation) {
            $conversation = ChatConversation::create([
                'customer_id' => $user->id,
                'worker_id' => $recipientId,
                'booking_id' => $bookingId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()->json([
            'data' => $conversation->load(['customer', 'worker']),
        ], 201);
    }

    public function messages(Request $request, string $conversationId): JsonResponse
    {
        $conversation = ChatConversation::find($conversationId);

        if (!$conversation) {
            return response()->json(['message' => 'Conversation not found'], 404);
        }

        if (!$this->isParticipant($request, $conversation)) {
            return response()->json(['message' => 'You are not a participant in this conversation'], 403);
        }

        $messages = ChatMessage::where('conversation_id', $conversationId)
            ->orderBy('created_at')
            ->limit(200)
            ->get();

        // Mark incoming as read for this viewer
        ChatMessage::where('conversation_id', $conversationId)
            ->where('sender_id', '!=', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['data' => $messages]);
    }

    public function send(Request $request, string $conversationId): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string|max:5000',
            'message_type' => 'nullable|string|in:text,image,file',
        ]);

        $conversation = ChatConversation::find($conversationId);

        if (!$conversation) {
            return response()->json(['message' => 'Conversation not found'], 404);
        }

        if (!$this->isParticipant($request, $conversation)) {
            return response()->json(['message' => 'You are not a participant in this conversation'], 403);
        }

        $message = ChatMessage::create([
            'conversation_id' => $conversationId,
            'sender_id' => $request->user()->id,
            'message' => $validated['message'],
            'message_type' => $validated['message_type'] ?? 'text',
            'is_read' => false,
            'created_at' => now(),
        ]);

        $conversation->touch();

        broadcast(new ChatMessageSent($message))->toOthers();

        return response()->json(['data' => $message], 201);
    }

    private function isParticipant(Request $request, ChatConversation $conversation): bool
    {
        $user = $request->user();

        return in_array($user->id, [$conversation->customer_id, $conversation->worker_id], true)
            || $user->hasRole('super_admin')
            || $user->hasRole('administrator')
            || $user->hasRole('customer_service');
    }
}
