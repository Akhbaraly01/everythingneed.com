<?php

namespace Modules\Vendors\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VendorEarningsController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $vendor = DB::table('vendors')->where('user_id', $request->user()->id)->first();

        if (!$vendor) {
            return response()->json(['message' => 'Vendor profile required'], 403);
        }

        $earned = (float) DB::table('vendor_commissions')
            ->where('vendor_id', $vendor->id)
            ->whereIn('status', ['cleared'])
            ->sum('amount');

        $paidOut = (float) DB::table('vendor_withdrawals')
            ->where('vendor_id', $vendor->id)
            ->whereIn('status', ['paid', 'completed'])
            ->sum('amount');

        $pendingWithdrawals = (float) DB::table('vendor_withdrawals')
            ->where('vendor_id', $vendor->id)
            ->where('status', 'pending')
            ->sum('amount');

        return response()->json([
            'data' => [
                'total_earned' => round($earned, 2),
                'withdrawn' => round($paidOut, 2),
                'pending_withdrawals' => round($pendingWithdrawals, 2),
                'available' => round(max(0, $earned - $paidOut - $pendingWithdrawals), 2),
                'currency' => \Core\Support\Currencies::default(),
            ],
        ]);
    }

    public function payouts(Request $request): JsonResponse
    {
        $vendor = DB::table('vendors')->where('user_id', $request->user()->id)->first();

        if (!$vendor) {
            return response()->json(['message' => 'Vendor profile required'], 403);
        }

        $withdrawals = DB::table('vendor_withdrawals')
            ->where('vendor_id', $vendor->id)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return response()->json(['data' => $withdrawals]);
    }

    public function requestPayout(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:1'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $vendor = DB::table('vendors')->where('user_id', $request->user()->id)->first();

        if (!$vendor) {
            return response()->json(['message' => 'Vendor profile required'], 403);
        }

        $earned = (float) DB::table('vendor_commissions')->where('vendor_id', $vendor->id)->sum('amount');
        $reserved = (float) DB::table('vendor_withdrawals')
            ->where('vendor_id', $vendor->id)
            ->whereIn('status', ['pending', 'paid', 'completed'])
            ->sum('amount');
        $available = max(0, $earned - $reserved);

        if ($validated['amount'] > $available) {
            return response()->json([
                'message' => 'Insufficient available balance',
                'error' => sprintf(
                    'You requested %s but only %s is available.',
                    number_format($validated['amount'], 2),
                    number_format($available, 2),
                ),
            ], 422);
        }

        // One pending request at a time keeps the ledger simple and safe.
        $hasPending = DB::table('vendor_withdrawals')
            ->where('vendor_id', $vendor->id)
            ->where('status', 'pending')
            ->exists();

        if ($hasPending) {
            return response()->json(['message' => 'A withdrawal request is already pending review.'], 409);
        }

        $id = (string) \Illuminate\Support\Str::uuid();

        DB::table('vendor_withdrawals')->insert([
            'id' => $id,
            'vendor_id' => $vendor->id,
            'amount' => $validated['amount'],
            'status' => 'pending',
            'notes' => $validated['notes'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'message' => 'Payout requested — finance will review shortly',
            'data' => ['id' => $id],
        ], 201);
    }
}
