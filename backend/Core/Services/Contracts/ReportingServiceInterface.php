<?php

namespace Core\Services\Contracts;

interface ReportingServiceInterface
{
    public function getDashboardStats(string $userId, ?string $role = null): array;
    public function getSalesReport(array $filters): array;
    public function getAnalyticsReport(array $filters): array;

    /** Cross-domain aggregates for the admin dashboard (GET /api/admin/stats). */
    public function adminDashboardStats(): array;

    /** Headline totals for the admin analytics overview. */
    public function adminOverview(string $range): array;

    /**
     * Daily time series.
     *
     * metric ∈ {users, revenue, traffic, activity, orders, bookings,
     * healthcare, learning, needs, services, wallet, payments}.
     * Unknown metrics and empty windows return [] (explicit empty state).
     */
    public function adminAnalyticsSeries(string $metric, \DateTimeInterface $since): array;

    /**
     * Spec §63 conversion funnel: signups → orders → succeeded payments.
     *
     * @return array{since: string, steps: array<int, array{label: string, value: int}>, signup_to_order_rate: float|null, order_to_paid_rate: float|null}
     */
    public function adminConversionFunnel(\DateTimeInterface $since): array;

    /** Top product categories by active listing count. */
    public function productCategoryBreakdown(): array;

    /** Revenue / commissions / payouts / subscriptions summary. */
    public function financeSummary(): array;

    /**
     * Paginated payment rows (admin finance ledger).
     *
     * @param  array{method?: string, status?: string, page?: int}  $filters
     * @return array{data: array, total: int}
     */
    public function paymentTransactions(array $filters = []): array;

    /**
     * Per-user dashboard aggregates (orders, wishlist, wallet, enrollments...).
     *
     * @return array{
     *     orders_count: int,
     *     total_orders: int,
     *     total_spent: float,
     *     orders_by_month: array<int, array{month: string, count: int, total: float}>,
     *     wishlist_count: int,
     *     wallet_balance: float,
     *     certificates_count: int,
     *     enrolled_courses: int,
     *     addresses_count: int,
     *     recent_orders: array<int, array{id: string, reference: string, total: float, status: string, created_at: mixed}>
     * }
     */
    public function userStats(string $userId): array;
}
