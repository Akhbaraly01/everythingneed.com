<?php

namespace Modules\Payments\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Payments\Services\PaymentService;
use Modules\Payments\Http\Requests\ChargePaymentRequest;
use Modules\Payments\Http\Resources\PaymentResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(
        private PaymentService $paymentService
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

    public function show(string $id): JsonResponse
    {
        $payment = $this->paymentService->getPayment($id);

        if (!$payment) {
            return response()->json(['message' => 'Payment not found'], 404);
        }

        return response()->json([
            'data' => new PaymentResource($payment),
        ]);
    }

    public function charge(ChargePaymentRequest $request): JsonResponse
    {
        $payment = $this->paymentService->charge(
            array_merge($request->validated(), ['user_id' => $request->user()->id])
        );

        return response()->json([
            'message' => 'Payment charged successfully',
            'data' => new PaymentResource($payment),
        ], 201);
    }

    public function refund(Request $request, string $id): JsonResponse
    {
        $refund = $this->paymentService->refund($id, $request->get('amount'));

        return response()->json([
            'message' => 'Refund initiated successfully',
            'data' => $refund,
        ]);
    }
}
