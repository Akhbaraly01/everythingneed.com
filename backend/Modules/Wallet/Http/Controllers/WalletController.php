<?php

namespace Modules\Wallet\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\WalletTransaction;
use Core\Support\KycGate;
use Modules\Wallet\Http\Requests\DepositRequest;
use Modules\Wallet\Http\Requests\HoldReferenceRequest;
use Modules\Wallet\Http\Requests\PlaceHoldRequest;
use Modules\Wallet\Http\Requests\TransferRequest;
use Modules\Wallet\Http\Requests\WithdrawRequest;
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
                'currency' => $wallet?->currency ?? \Core\Support\Currencies::default(),
            ],
        ]);
    }

    public function transactions(Request $request): JsonResponse
    {
        $transactions = $this->walletService->getTransactions(
            $request->user()->id,
            $request->get('page', 1),
            $request->get('per_page', 15),
            $request->get('type')
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

    public function showTransaction(Request $request, string $id): JsonResponse
    {
        $wallet = $this->walletService->getWallet($request->user()->id);

        $transaction = WalletTransaction::where('wallet_id', $wallet->id)
            ->where('id', $id)
            ->first();

        if (!$transaction) {
            return response()->json(['message' => 'Transaction not found'], 404);
        }

        return response()->json(['data' => $transaction]);
    }

    public function transfer(TransferRequest $request): JsonResponse
    {
        // Spec 28: moving money out requires a verified identity.
        KycGate::requireVerified($request->user()->id, 'Transfers');

        $validated = $request->validated();

        $result = $this->walletService->transfer(
            $request->user()->id,
            $validated['to_user_id'],
            (float) $validated['amount'],
            $validated['idempotency_key'] ?? null
        );

        return response()->json([
            'message' => 'Transfer successful',
            'data' => $result,
        ], 201);
    }

    public function deposit(DepositRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $transaction = $this->walletService->deposit(
            $request->user()->id,
            $validated['amount'],
            $validated['payment_method'],
            $validated['idempotency_key'] ?? null
        );

        return response()->json([
            'message' => 'Deposit successful',
            'data' => $transaction,
        ]);
    }

    public function withdraw(WithdrawRequest $request): JsonResponse
    {
        // Spec 28: moving money out requires a verified identity.
        KycGate::requireVerified($request->user()->id, 'Withdrawals');

        $validated = $request->validated();

        $transaction = $this->walletService->withdraw(
            $request->user()->id,
            $validated['amount'],
            $validated['idempotency_key'] ?? null
        );

        return response()->json([
            'message' => 'Withdrawal successful',
            'data' => $transaction,
        ]);
    }

    public function available(Request $request): JsonResponse
    {
        $wallet = $this->walletService->getWallet($request->user()->id);
        $available = $this->walletService->availableBalance($request->user()->id);
        $balance = (float) $wallet->balance;

        return response()->json([
            'data' => [
                'balance' => $balance,
                'available' => $available,
                'pending' => max(0, round($balance - $available, 2)),
                'currency' => $wallet->currency ?? \Core\Support\Currencies::default(),
            ],
        ]);
    }

    public function holds(Request $request): JsonResponse
    {
        $holds = $this->walletService->holds(
            $request->user()->id,
            (int) $request->get('page', 1),
            (int) $request->get('per_page', 15)
        );

        return response()->json([
            'data' => $holds->items(),
            'meta' => [
                'current_page' => $holds->currentPage(),
                'last_page' => $holds->lastPage(),
                'per_page' => $holds->perPage(),
                'total' => $holds->total(),
            ],
        ]);
    }

    public function placeHold(PlaceHoldRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $hold = $this->walletService->placeHold(
            $request->user()->id,
            $validated['amount'],
            $validated['reference'],
            $validated['reason'] ?? null,
            $validated['order_id'] ?? null
        );

        return response()->json([
            'message' => 'Hold placed',
            'data' => $hold,
        ], 201);
    }

    public function releaseHold(HoldReferenceRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $hold = $this->walletService->release($request->user()->id, $validated['reference']);

        return response()->json([
            'message' => 'Hold released',
            'data' => $hold,
        ]);
    }

    public function captureHold(HoldReferenceRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $result = $this->walletService->capture($request->user()->id, $validated['reference']);

        return response()->json([
            'message' => 'Hold captured',
            'data' => $result,
        ]);
    }
}
