<?php

namespace Core\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Modules\Notifications\Events\NotificationCreated;

/**
 * Cross-module user notification helper.
 *
 * Persists to the notifications table and pushes a realtime event over
 * Reverb on the private user.{id} channel.
 */
class NotificationService
{
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

        broadcast(new NotificationCreated($userId, [
            'title' => $title,
            'message' => mb_substr($message, 0, 120),
            'type' => $type,
            'related_id' => $relatedId,
            'is_read' => false,
            'created_at' => $now->toIso8601String(),
        ]));
    }
}
