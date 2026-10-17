<?php

namespace Core\Services;

use Core\Services\Contracts\NotificationServiceInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Modules\Notifications\Entities\Notification;
use Modules\Notifications\Events\NotificationCreated;

/**
 * Cross-module user notification helper.
 *
 * Persists to the notifications table and pushes a realtime event over
 * Reverb on the private user.{id} channel. Implements the Core contract
 * so typed injection (NotificationServiceInterface) resolves honestly.
 */
class NotificationService implements NotificationServiceInterface
{
    /**
     * Array-driven send: expects user_id, title, message and optional
     * type / related_id. Delegates to notify() so every path shares the
     * same persistence + broadcast behaviour.
     */
    public function send(array $data): void
    {
        $this->notify(
            (string) ($data['user_id'] ?? ''),
            (string) ($data['title'] ?? 'Notification'),
            (string) ($data['message'] ?? ''),
            (string) ($data['type'] ?? 'general'),
            isset($data['related_id']) ? (string) $data['related_id'] : null,
        );
    }

    public function notify(string $userId, string $title, string $message, string $type = 'general', ?string $relatedId = null): void
    {
        $now = now();
        $notificationId = (string) Str::uuid();

        DB::table('notifications')->insert([
            'id' => $notificationId,
            'user_id' => $userId,
            'title' => $title,
            'message' => mb_substr($message, 0, 500),
            'type' => $type,
            'related_id' => $relatedId,
            'is_read' => false,
            'created_at' => $now,
        ]);

        // Realtime push is best-effort: a Reverb/broadcaster outage must never
        // fail the business operation (checkout, replies, payouts) that queued
        // this notification — the row above is already persisted.
        try {
            // Identifiers only on the socket: titles/bodies stay server-side
            // and clients fetch them over the authed notifications API.
            broadcast(new NotificationCreated($userId, [
                'id' => $notificationId,
                'type' => $type,
                'related_id' => $relatedId,
                'created_at' => $now->toIso8601String(),
            ]));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Broadcast skipped (notification not pushed): ' . $e->getMessage(), [
                'type' => $type,
                'user_id' => $userId,
            ]);
        }
    }

    public function hasNotified(string $userId, string $type, ?string $relatedId = null): bool
    {
        $query = DB::table('notifications')
            ->where('user_id', $userId)
            ->where('type', $type);

        if ($relatedId !== null) {
            $query->where('related_id', $relatedId);
        }

        return $query->exists();
    }

    /**
     * Trusted-caller mark-read (Core service layer); HTTP callers go through
     * the Notifications module controller which scopes by authenticated user.
     */
    public function markAsRead(string $id): object
    {
        $notification = Notification::findOrFail($id);
        $notification->markAsRead();

        return $notification;
    }

    public function markAllAsRead(string $userId): bool
    {
        $updated = DB::table('notifications')
            ->where('user_id', $userId)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return $updated > 0;
    }

    public function getUnreadCount(string $userId): int
    {
        return (int) DB::table('notifications')
            ->where('user_id', $userId)
            ->where('is_read', false)
            ->count();
    }
}
