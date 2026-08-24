<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminFinanceController extends Controller
{
    public function summary(): JsonResponse
    {
        $totalRevenue = DB::table('payments')->where('status', 'completed')->sum('amount') ?? 0;
        $totalCommissions = DB::table('vendor_commissions')->sum('amount') ?? 0;
        $pendingPayouts = DB::table('vendor_withdrawals')->where('status', 'pending')->sum('amount') ?? 0;
        $activeSubscriptions = DB::table('subscriptions')->where('status', 'active')->count();

        return response()->json([
            'data' => [
                'total_revenue' => (float) $totalRevenue,
                'total_commissions' => (float) $totalCommissions,
                'pending_payouts' => (float) $pendingPayouts,
                'active_subscriptions' => (int) $activeSubscriptions,
            ],
        ]);
    }

    public function transactions(Request $request): JsonResponse
    {
        $query = DB::table('payments')->orderByDesc('created_at');

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        $total = $query->count();
        $transactions = $query->offset(($request->get('page', 1) - 1) * 15)->limit(15)->get();

        return response()->json([
            'data' => $transactions,
            'total' => $total,
        ]);
    }

    public function withdrawals(Request $request): JsonResponse
    {
        $query = DB::table('vendor_withdrawals')->orderByDesc('created_at');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $total = $query->count();
        $withdrawals = $query->offset(($request->get('page', 1) - 1) * 15)->limit(15)->get();

        return response()->json([
            'data' => $withdrawals,
            'total' => $total,
        ]);
    }
}
