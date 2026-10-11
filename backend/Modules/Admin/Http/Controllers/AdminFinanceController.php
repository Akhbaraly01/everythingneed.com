<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Core\Services\Contracts\ReportingServiceInterface;
use Core\Services\Contracts\VendorQueryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminFinanceController extends Controller
{
    public function __construct(
        private ReportingServiceInterface $reporting,
        private VendorQueryInterface $vendors,
    ) {}

    public function summary(): JsonResponse
    {
        return response()->json(['data' => $this->reporting->financeSummary()]);
    }

    public function transactions(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'method' => ['nullable', 'string', 'max:40'],
            'status' => ['nullable', 'string', 'max:40'],
            'page'   => ['nullable', 'integer', 'min:1'],
        ]);

        $result = $this->reporting->paymentTransactions([
            'method' => $validated['method'] ?? null,
            'status' => $validated['status'] ?? null,
            'page'   => (int) ($validated['page'] ?? 1),
        ]);

        return response()->json($result);
    }

    public function withdrawals(Request $request): JsonResponse
    {
        $result = $this->vendors->withdrawals([
            'status' => $request->has('status') ? $request->status : null,
            'page'   => (int) $request->get('page', 1),
        ]);

        return response()->json($result);
    }

    public function processWithdrawal(Request $request, string $id): JsonResponse
    {
        $withdrawal = $this->vendors->findWithdrawal($id);

        if (!$withdrawal) {
            return response()->json(['message' => 'Withdrawal not found'], 404);
        }

        if ($withdrawal->status !== 'pending') {
            return response()->json(['message' => 'Withdrawal is not pending'], 422);
        }

        $this->vendors->markWithdrawalPaid($id);

        return response()->json(['message' => 'Withdrawal processed']);
    }
}
