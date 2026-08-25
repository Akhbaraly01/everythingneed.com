<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Modules\Products\Entities\Product;

class AdminProductApprovalController extends Controller
{
    public function pending(Request $request): JsonResponse
    {
        $pending = Product::with('vendor:id,store_name')
            ->whereNull('approved_at')
            ->orderBy('created_at')
            ->paginate($request->get('per_page', 20));

        return response()->json([
            'data' => $pending->items(),
            'meta' => [
                'current_page' => $pending->currentPage(),
                'last_page' => $pending->lastPage(),
                'per_page' => $pending->perPage(),
                'total' => $pending->total(),
            ],
        ]);
    }

    public function approve(Request $request, string $id): JsonResponse
    {
        return $this->decide($id, true);
    }

    public function reject(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        return $this->decide($id, false, $validated['reason'] ?? null);
    }

    private function decide(string $id, bool $approve, ?string $reason = null): JsonResponse
    {
        $product = Product::withTrashed()->find($id);

        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        DB::transaction(function () use ($product, $approve, $reason) {
            if ($approve) {
                // Approving publishes: visible AND active in one atomic decision.
                $product->forceFill([
                    'approved_at' => now(),
                    'is_active' => true,
                ])->save();

                if (property_exists($product, 'deleted_at') && $product->trashed()) {
                    $product->restore();
                }
            } else {
                // Rejection keeps it out of the queue and out of the catalogue.
                $product->update(['is_active' => false]);

                DB::table('rejected_products')->insert([
                    'id' => (string) \Illuminate\Support\Str::uuid(),
                    'product_id' => $product->id,
                    'reason' => $reason,
                    'created_by' => auth()->id(),
                    'created_at' => now(),
                ]);
            }
        });

        return response()->json([
            'message' => $approve ? 'Product approved and published' : 'Product rejected',
            'data' => $product->fresh(),
        ]);
    }
}
