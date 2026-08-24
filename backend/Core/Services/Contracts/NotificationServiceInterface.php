<?php

namespace Core\Services\Contracts;

interface NotificationServiceInterface
{
    public function send(array $data): void;
    public function markAsRead(string $id): object;
    public function markAllAsRead(string $userId): bool;
    public function getUnreadCount(string $userId): int;
}
