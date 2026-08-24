<?php

namespace Modules\Wallet\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Wallet\Services\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WalletController extends Controller
{
    public function __construct(
        private WalletService $walletService
    ) {}

    public function balance(Request $request): JsonResponse
    {
        $wallet = $this->walletService->getWallet($request->user()->id);

        return response()->json([
            'data' => [
                'balance' => $wallet?->balance ?? 0,
                'currency' => $wallet?->currency ?? 'USD',
            ],
        ]);
    }

    public function transactions(Request $request): JsonResponse
    {
        $transactions = $this->walletService->getTransactions(
            $request->user()->id,
            $request->get('page', 1),
            $request->get('per_page', 15)
        );

        return response()->json([
            'data' => $transactions->items(),
            'meta' => [
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'per_page' => $transactions->perPage(),
                'total' => $transactions->total(),
            ],
        ]);
    }

    public function deposit(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:1',
            'payment_method' => 'required|string',
        ]);

        $transaction = $this->walletService->deposit(
            $request->user()->id,
            $validated['amount'],
            $validated['payment_method']
        );

        return response()->json([
            'message' => 'Deposit successful',
            'data' => $transaction,
        ]);
    }

    public function withdraw(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:1',
        ]);

        $transaction = $this->walletService->withdraw(
            $request->user()->id,
            $validated['amount']
        );

        return response()->json([
            'message' => 'Withdrawal successful',
            'data' => $transaction,
        ]);
    }
}
