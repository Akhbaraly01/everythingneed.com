<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Core\Services\Contracts\AuditServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Messaging\Entities\ChatConversation;
use Modules\Messaging\Entities\ChatMessage;

/**
 * Support/moderator access to direct chat conversations. Read access needs
 * messaging.overview.view; deletion and restoration need the manage grant.
 */
class AdminMessagingController extends Controller
{
    public function __construct(private AuditServiceInterface $audit) {}

    public function conversations(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'status' => ['nullable', 'string', 'in:all,active,removed'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
        ]);

        $query = ChatConversation::query()
            ->with(['customer:id,name,email', 'worker:id,name,email'])
            ->withCount('messages');

        match ($validated['status'] ?? 'all') {
            'removed' => $query->onlyTrashed(),
            'active' => null,
            default => $query->withTrashed(),
        };

        if ($search = trim((string) ($validated['search'] ?? ''))) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('customer', fn ($user) => $user
                    ->where('name', 'ilike', "%{$search}%")
                    ->orWhere('email', 'ilike', "%{$search}%"))
                    ->orWhereHas('worker', fn ($user) => $user
                        ->where('name', 'ilike', "%{$search}%")
                        ->orWhere('email', 'ilike', "%{$search}%"))
                    ->orWhereHas('messages', fn ($message) => $message
                        ->where('message', 'ilike', "%{$search}%"));
            });
        }

        $paginated = $query->orderByDesc('updated_at')->paginate($validated['per_page'] ?? 20);

        return response()->json([
            'data' => $paginated->items(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $conversation = ChatConversation::withTrashed()
            ->with(['customer:id,name,email', 'worker:id,name,email'])
            ->find($id);

        if (! $conversation) {
            return response()->json(['message' => 'Conversation not found'], 404);
        }

        $conversation->setRelation('messages', ChatMessage::withTrashed()
            ->where('conversation_id', $conversation->id)
            ->with('sender:id,name,email')
            ->orderBy('created_at')
            ->limit(500)
            ->get());

        return response()->json(['data' => $conversation]);
    }

    public function destroyConversation(Request $request, string $id): JsonResponse
    {
        $conversation = ChatConversation::find($id);
        if (! $conversation) {
            return response()->json(['message' => 'Conversation not found'], 404);
        }

        $messageCount = ChatMessage::where('conversation_id', $conversation->id)->count();
        $conversation->delete();

        try {
            $this->audit->log([
                'action' => 'messaging.conversation.removed',
                'entity_type' => 'chat_conversation',
                'entity_id' => $conversation->id,
                'performed_by' => $request->user()->id,
                'old_values' => [
                    'customer_id' => $conversation->customer_id,
                    'worker_id' => $conversation->worker_id,
                    'messages' => $messageCount,
                ],
            ]);
        } catch (\Throwable) {
        }

        return response()->json(['message' => 'Conversation removed']);
    }

    public function restoreConversation(Request $request, string $id): JsonResponse
    {
        $conversation = ChatConversation::withTrashed()->find($id);
        if (! $conversation) {
            return response()->json(['message' => 'Conversation not found'], 404);
        }

        if ($conversation->trashed()) {
            $conversation->restore();

            try {
                $this->audit->log([
                    'action' => 'messaging.conversation.restored',
                    'entity_type' => 'chat_conversation',
                    'entity_id' => $conversation->id,
                    'performed_by' => $request->user()->id,
                ]);
            } catch (\Throwable) {
            }
        }

        return response()->json(['message' => 'Conversation restored']);
    }

    public function destroyMessage(Request $request, string $id): JsonResponse
    {
        $message = ChatMessage::find($id);
        if (! $message) {
            return response()->json(['message' => 'Message not found'], 404);
        }

        $message->delete();

        try {
            $this->audit->log([
                'action' => 'messaging.message.removed',
                'entity_type' => 'chat_message',
                'entity_id' => $message->id,
                'performed_by' => $request->user()->id,
                'old_values' => [
                    'conversation_id' => $message->conversation_id,
                    'sender_id' => $message->sender_id,
                ],
            ]);
        } catch (\Throwable) {
        }

        return response()->json(['message' => 'Message removed']);
    }
}
