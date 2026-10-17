<?php

namespace Core\Services\Contracts;

interface NotificationServiceInterface
{
    public function send(array $data): void;
    public function notify(string $userId, string $title, string $message, string $type = 'general', ?string $relatedId = null): void;

    /**
     * Idempotency guard for fan-outs (N-26): has this user already been
     * told about this (type, related) pair? Lives on the contract so
     * module code never reads the notifications table directly.
     */
    public function hasNotified(string $userId, string $type, ?string $relatedId = null): bool;

    public function markAsRead(string $id): object;
    public function markAllAsRead(string $userId): bool;
    public function getUnreadCount(string $userId): int;
}
