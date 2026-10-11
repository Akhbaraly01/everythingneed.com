<?php

namespace Modules\Payments\Http\Controllers;

use App\Http\Controllers\Controller;
use Core\Services\Contracts\WalletServiceInterface;
use Core\Support\KycGate;
use Modules\Payments\Services\PaymentService;
use Modules\Payments\Http\Requests\ChargePaymentRequest;
use Modules\Payments\Http\Resources\PaymentResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(
        private PaymentService $paymentService,
        private WalletServiceInterface $wallets
    ) {}

    public function index(Request $request): JsonResponse
    {
        $payments = $this->paymentService->getUserPayments(
            $request->user()->id,
            $request->get('page', 1),
            $request->get('per_page', 15)
        );

        return response()->json([
            'data' => PaymentResource::collection($payments->items()),
            'meta' => [
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
                'per_page' => $payments->perPage(),
                'total' => $payments->total(),
            ],
        ]);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $payment = $this->paymentService->getPayment($id);

        if (!$payment) {
            return response()->json(['message' => 'Payment not found'], 404);
        }

        $me = $request->user();
        if ((string) $payment->user_id !== (string) $me->id && !$me->hasPermission('payments.payments.view')) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json([
            'data' => new PaymentResource($payment),
        ]);
    }

    public function charge(ChargePaymentRequest $request): JsonResponse
    {
        $payload = array_merge($request->validated(), ['user_id' => $request->user()->id]);
        // Server-derived purpose (spec 31): never trust a client label.
        $payload['purpose'] = ($payload['order_id'] ?? null) ? 'order_payment' : 'checkout';

        $payment = $this->paymentService->charge($payload);

        return response()->json([
            'message' => 'Payment charged successfully',
            'data' => new PaymentResource($payment),
        ], 201);
    }

    /**
     * Methods that genuinely work right now (spec 31 + 73): never offer an
     * unconfigured gateway. Wallet appears only for verified identities
     * (spec 28), enabled only while spendable funds exist (spec 29).
     */
    public function methods(Request $request): JsonResponse
    {
        $driver = (string) config('payments.driver', 'mock');
        $live = $driver !== 'mock';

        $methods = [
            ['id' => 'card', 'label' => 'Card', 'enabled' => true],
        ];

        if ($live) {
            $methods[] = ['id' => $driver, 'label' => ucfirst($driver), 'enabled' => true];
        }

        $me = $request->user();
        if ($me && KycGate::isVerified((string) $me->id)) {
            $available = $this->wallets->getAvailableBalance((string) $me->id);
            $methods[] = [
                'id' => 'wallet',
                'label' => 'Wallet',
                'enabled' => $available > 0,
                'available' => $available,
            ];
        }

        return response()->json([
            'data' => [
                'mode' => $live ? 'live' : 'sandbox',
                'driver' => $driver,
                'methods' => $methods,
            ],
        ]);
    }

    public function refund(Request $request, string $id): JsonResponse
    {
        $refund = $this->paymentService->refund($id, $request->get('amount'));

        return response()->json([
            'message' => 'Refund initiated successfully',
            'data' => $refund,
        ]);
    }

    /**
     * Gap 3: the customer raises a refund REQUEST immediately (pending, no
     * money moves). Support later reviews and processes it same-method.
     */
    public function requestRefund(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'amount' => ['nullable', 'numeric', 'min:0.01'],
            'reason' => ['nullable', 'string', 'max:500'],
            'idempotency_key' => ['nullable', 'string', 'max:100'],
        ]);

        $payment = $this->paymentService->getPayment($id);
        if (!$payment || (string) $payment->user_id !== (string) $request->user()->id) {
            return response()->json(['message' => 'Payment not found'], 404);
        }

        try {
            $refund = $this->paymentService->requestRefund(
                $id,
                $request->user()->id,
                isset($validated['amount']) ? (float) $validated['amount'] : null,
                $validated['reason'] ?? null,
                $validated['idempotency_key'] ?? null,
            );
        } catch (\Core\Exceptions\ValidationException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Refund request submitted for review',
            'data' => $refund,
        ], 202);
    }

    /** The current user's refund requests with payment context. */
    public function myRefunds(Request $request): JsonResponse
    {
        $refunds = $this->paymentService->myRefunds(
            $request->user()->id,
            (int) $request->get('page', 1),
            (int) $request->get('per_page', 15),
        );

        return response()->json([
            'data' => $refunds->items(),
            'meta' => [
                'current_page' => $refunds->currentPage(),
                'last_page' => $refunds->lastPage(),
                'per_page' => $refunds->perPage(),
                'total' => $refunds->total(),
            ],
        ]);
    }

    /** Saved payment methods for the current user (spec 26). */
    public function savedMethods(Request $request): JsonResponse
    {
        return response()->json([
            'data' => app(\Core\Services\Contracts\PaymentGatewayInterface::class)
                ->savedMethods($request->user()->id),
        ]);
    }

    /** Store a payment method reference (card/bank; details stay with the provider). */
    public function storeMethod(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'string', 'in:card,bank'],
            'last_four' => ['required', 'digits:4'],
            'brand' => ['nullable', 'string', 'max:30'],
        ]);

        $method = app(\Core\Services\Contracts\PaymentGatewayInterface::class)
            ->attachMethod($request->user()->id, $validated);

        return response()->json([
            'message' => 'Payment method saved',
            'data' => $method,
        ], 201);
    }

    public function removeMethod(Request $request, string $id): JsonResponse
    {
        $removed = app(\Core\Services\Contracts\PaymentGatewayInterface::class)
            ->detachMethod($request->user()->id, $id);

        if (!$removed) {
            return response()->json(['message' => 'Payment method not found'], 404);
        }

        return response()->json(['message' => 'Payment method removed']);
    }
}
