<?php

namespace Core\Services\Contracts;

interface NotificationServiceInterface
{
    public function send(array $data): void;
    public function notify(string $userId, string $title, string $message, string $type = 'general', ?string $relatedId = null): void;
    public function markAsRead(string $id): object;
    public function markAllAsRead(string $userId): bool;
    public function getUnreadCount(string $userId): int;
}
