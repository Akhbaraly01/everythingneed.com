<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminAnalyticsController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        $range = $request->get('range', '30d');
        $since = now()->subDays((int) str_replace('d', '', $range));

        $totalUsers = DB::table('users')->count();
        $totalRevenue = DB::table('payments')->where('status', 'succeeded')->sum('amount') ?? 0;
        $totalOrders = DB::table('vendor_orders')->count();
        $activeVendors = DB::table('vendors')->where('is_verified', true)->count();

        return response()->json([
            'data' => [
                'total_users' => (int) $totalUsers,
                'total_revenue' => (float) $totalRevenue,
                'total_orders' => (int) $totalOrders,
                'active_vendors' => (int) $activeVendors,
            ],
        ]);
    }

    public function userGrowth(Request $request): JsonResponse
    {
        $range = $this->getRange($request);
        $data = DB::table('users')
            ->select(DB::raw('DATE(created_at) as label'), DB::raw('COUNT(*) as value'))
            ->where('created_at', '>=', $range)
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('label')
            ->get();

        return response()->json(['data' => $data]);
    }

    public function revenue(Request $request): JsonResponse
    {
        $range = $this->getRange($request);
        $data = DB::table('payments')
            ->select(DB::raw('DATE(created_at) as label'), DB::raw('SUM(amount) as value'))
            ->where('status', 'succeeded')
            ->where('created_at', '>=', $range)
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('label')
            ->get();

        return response()->json(['data' => $data]);
    }

    public function categories(Request $request): JsonResponse
    {
        $data = DB::table('products')
            ->select('category as label', DB::raw('COUNT(*) as value'))
            ->whereNotNull('category')
            ->where('is_active', true)
            ->groupBy('category')
            ->orderByDesc('value')
            ->limit(10)
            ->get();

        return response()->json(['data' => $data]);
    }

    public function traffic(Request $request): JsonResponse
    {
        $range = $this->getRange($request);
        $data = DB::table('audit_logs')
            ->select(DB::raw('DATE(created_at) as label'), DB::raw('COUNT(*) as value'))
            ->where('created_at', '>=', $range)
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('label')
            ->get();

        return response()->json(['data' => $data]);
    }

    private function getRange(Request $request): \Illuminate\Support\Carbon
    {
        $range = $request->get('range', '30d');
        $days = (int) str_replace('d', '', $range);
        return now()->subDays($days);
    }
}
