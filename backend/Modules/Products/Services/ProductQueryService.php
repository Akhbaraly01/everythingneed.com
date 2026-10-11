<?php

namespace Modules\Products\Services;

use Core\Services\BaseService;
use Core\Services\Contracts\ProductQueryInterface;
use Illuminate\Support\Facades\DB;
use Modules\Products\Entities\Product;

class ProductQueryService extends BaseService implements ProductQueryInterface
{
    public function pending(int $perPage = 20, ?string $categoryScope = null): array
    {
        $pending = Product::with('vendor:id,store_name')
            ->whereNull('approved_at')
            ->when($categoryScope !== null, fn ($q) => $q->where('category', $categoryScope))
            ->orderBy('created_at')
            ->paginate($perPage);

        return [
            'data' => $pending->items(),
            'meta' => [
                'current_page' => $pending->currentPage(),
                'last_page'    => $pending->lastPage(),
                'per_page'     => $pending->perPage(),
                'total'        => $pending->total(),
            ],
        ];
    }

    public function decide(string $id, bool $approve, ?string $reason = null, ?string $categoryScope = null): ?object
    {
        $product = Product::withTrashed()->find($id);

        if (! $product) {
            return null;
        }

        if ($categoryScope !== null && $product->category !== $categoryScope) {
            // Out of scope: same null as "missing" so callers cannot probe IDs.
            return null;
        }

        DB::transaction(function () use ($product, $approve, $reason) {
            if ($approve) {
                // Approving publishes: visible AND active in one atomic decision.
                $product->forceFill([
                    'approved_at' => now(),
                    'is_active'   => true,
                    'publication_state' => 'published',
                ])->save();

                if (property_exists($product, 'deleted_at') && $product->trashed()) {
                    $product->restore();
                }
            } else {
                // Rejection keeps it out of the queue and out of the catalogue.
                $product->update(['is_active' => false, 'publication_state' => 'hidden']);

                DB::table('rejected_products')->insert([
                    'id'         => (string) \Illuminate\Support\Str::uuid(),
                    'product_id' => $product->id,
                    'reason'     => $reason,
                    'created_by' => auth()->id(),
                    'created_at' => now(),
                ]);
            }
        });

        return $product->fresh();
    }
}
