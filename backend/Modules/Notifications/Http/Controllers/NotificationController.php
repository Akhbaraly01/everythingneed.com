<?php

namespace Modules\Notifications\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Notifications\Entities\Notification;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = $request->user()->notifications();

        if ($request->filled('type')) {
            $query->where('type', $request->get('type'));
        }

        if ($request->get('is_read') !== null && $request->get('is_read') !== '') {
            $query->where('is_read', $request->boolean('is_read'));
        }

        $notifications = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $notifications->items(),
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
            ],
        ]);
    }

    /** Unread badge count for the current user. */
    public function unreadCount(Request $request): JsonResponse
    {
        return response()->json([
            'data' => [
                'unread' => $request->user()->notifications()->where('is_read', false)->count(),
            ],
        ]);
    }

    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->find($id);

        if (!$notification) {
            return response()->json(['message' => 'Notification not found'], 404);
        }

        $notification->markAsRead();

        return response()->json([
            'message' => 'Notification marked as read',
        ]);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        // Direct query update: scoped to this user's unread rows only
        // (a Collection->markAsRead() call would not exist / not be scoped).
        $request->user()->notifications()->where('is_read', false)->update(['is_read' => true]);

        return response()->json([
            'message' => 'All notifications marked as read',
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->find($id);

        if (!$notification) {
            return response()->json(['message' => 'Notification not found'], 404);
        }

        $notification->delete();

        return response()->json([
            'message' => 'Notification deleted',
        ]);
    }
}
