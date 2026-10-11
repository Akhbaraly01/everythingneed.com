<?php

namespace Modules\Bills\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Bills\Actions\PurchaseBill;
use Modules\Bills\Entities\BillPurchase;
use Modules\Bills\Http\Requests\PurchaseBillRequest;
use Modules\Bills\Http\Resources\BillPurchaseResource;
use Modules\Bills\Support\BillCatalog;

class BillsController extends Controller
{
    public function __construct(
        private PurchaseBill $purchaseBill
    ) {}

    /** Service catalog with availability for a country/currency pair. */
    public function services(Request $request): JsonResponse
    {
        $country = $request->get('country');
        $currency = $request->get('currency');

        return response()->json([
            'data' => BillCatalog::shaped(
                is_string($country) ? $country : null,
                is_string($currency) ? $currency : null
            ),
        ]);
    }

    public function purchase(PurchaseBillRequest $request): JsonResponse
    {
        $purchase = $this->purchaseBill->execute(
            $request->user()->id,
            $request->validated()
        );

        return response()->json([
            'message' => 'Bill purchase recorded',
            'data' => new BillPurchaseResource($purchase),
        ], 201);
    }

    public function index(Request $request): JsonResponse
    {
        $purchases = BillPurchase::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->paginate((int) $request->get('per_page', 15), ['*'], 'page', (int) $request->get('page', 1));

        return response()->json([
            'data' => BillPurchaseResource::collection($purchases->items()),
            'meta' => [
                'current_page' => $purchases->currentPage(),
                'last_page' => $purchases->lastPage(),
                'per_page' => $purchases->perPage(),
                'total' => $purchases->total(),
            ],
        ]);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $purchase = BillPurchase::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->first();

        if (!$purchase) {
            return response()->json(['message' => 'Bill purchase not found'], 404);
        }

        return response()->json(['data' => new BillPurchaseResource($purchase)]);
    }
}
