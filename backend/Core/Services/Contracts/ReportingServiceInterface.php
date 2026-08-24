<?php

namespace Core\Services\Contracts;

interface ReportingServiceInterface
{
    public function getDashboardStats(string $userId, ?string $role = null): array;
    public function getSalesReport(array $filters): array;
    public function getAnalyticsReport(array $filters): array;
}
