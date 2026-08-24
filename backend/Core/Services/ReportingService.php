<?php

namespace Core\Services;

use App\Models\User;
use App\Models\Wallet;
use Core\Services\Contracts\ReportingServiceInterface;
use Illuminate\Support\Facades\DB;
use Modules\Orders\Entities\VendorOrder;
use Modules\Products\Entities\Product;
use Modules\Vendors\Entities\Vendor;
use Modules\Analytics\Entities\AnalyticsEvent;

class ReportingService extends BaseService implements ReportingServiceInterface
{
    public function getDashboardStats(string $userId, ?string $role = null): array
    {
        $user = User::findOrFail($userId);

        if ($role === 'admin') {
            return $this->getAdminStats();
        }

        if ($role === 'vendor') {
            return $this->getVendorStats($userId);
        }

        return $this->getUserStats($userId);
    }

    public function getSalesReport(array $filters): array
    {
        $startDate = $filters['start_date'] ?? now()->subDays(30)->startOfDay();
        $endDate = $filters['end_date'] ?? now()->endOfDay();
        $vendorId = $filters['vendor_id'] ?? null;

        $query = VendorOrder::whereBetween('created_at', [$startDate, $endDate]);

        if ($vendorId) {
            $query->where('vendor_id', $vendorId);
        }

        $orders = $query->get();

        $totalRevenue = $orders->sum('total_price');
        $totalOrders = $orders->count();
        $avgOrderValue = $totalOrders > 0 ? round($totalRevenue / $totalOrders, 2) : 0;

        $dailyBreakdown = $orders->groupBy(function ($order) {
            return $order->created_at->format('Y-m-d');
        })->map(function ($dayOrders) {
            return [
                'revenue' => round($dayOrders->sum('total_price'), 2),
                'orders' => $dayOrders->count(),
            ];
        });

        return [
            'period' => ['start' => $startDate, 'end' => $endDate],
            'total_revenue' => round($totalRevenue, 2),
            'total_orders' => $totalOrders,
            'avg_order_value' => $avgOrderValue,
            'daily_breakdown' => $dailyBreakdown,
        ];
    }

    public function getAnalyticsReport(array $filters): array
    {
        $startDate = $filters['start_date'] ?? now()->subDays(30)->startOfDay();
        $endDate = $filters['end_date'] ?? now()->endOfDay();
        $eventType = $filters['event_type'] ?? null;

        $query = AnalyticsEvent::whereBetween('created_at', [$startDate, $endDate]);

        if ($eventType) {
            $query->where('event_type', $eventType);
        }

        $events = $query->get();

        $eventBreakdown = $events->groupBy('event_type')->map(function ($group) {
            return $group->count();
        });

        return [
            'period' => ['start' => $startDate, 'end' => $endDate],
            'total_events' => $events->count(),
            'event_breakdown' => $eventBreakdown,
            'unique_users' => $events->pluck('user_id')->unique()->count(),
        ];
    }

    private function getAdminStats(): array
    {
        return [
            'total_users' => User::count(),
            'total_vendors' => Vendor::count(),
            'total_products' => Product::count(),
            'total_orders' => VendorOrder::count(),
            'total_revenue' => round(VendorOrder::sum('total_price'), 2),
            'recent_orders' => VendorOrder::latest()->take(10)->get(),
        ];
    }

    private function getVendorStats(string $vendorId): array
    {
        $vendor = Vendor::where('user_id', $vendorId)->first();

        $orders = VendorOrder::where('vendor_id', $vendor->id ?? null)->get();

        return [
            'vendor_id' => $vendorId,
            'total_orders' => $orders->count(),
            'total_revenue' => round($orders->sum('total_price'), 2),
            'total_products' => Product::where('vendor_id', $vendor->id ?? null)->count(),
            'pending_orders' => $orders->where('status', 'pending')->count(),
        ];
    }

    private function getUserStats(string $userId): array
    {
        $wallet = Wallet::where('user_id', $userId)->first();

        return [
            'user_id' => $userId,
            'wallet_balance' => $wallet ? (float) $wallet->balance : 0,
            'total_orders' => VendorOrder::where('customer_id', $userId)->count(),
        ];
    }
}
