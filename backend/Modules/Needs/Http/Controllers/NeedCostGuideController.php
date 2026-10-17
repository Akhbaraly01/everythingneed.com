<?php

namespace Modules\Needs\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Needs\Entities\NeedCostGuide;

/**
 * N-29 public cost-guide endpoints: published guides only,
 * filterable by category, slug-addressable for SEO-friendly URLs.
 */
class NeedCostGuideController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = NeedCostGuide::published()
            ->with('category:id,name,slug')
            ->orderBy('created_at', 'desc');

        if ($request->filled('category_id')) {
            $query->where('need_category_id', $request->get('category_id'));
        }

        if ($request->filled('category_slug')) {
            $query->whereHas('category', fn ($q) => $q->where('slug', $request->get('category_slug')));
        }

        if ($request->filled('q')) {
            $q = trim((string) $request->get('q'));
            $query->where(function ($sub) use ($q) {
                $sub->where('title', 'ilike', "%{$q}%")
                    ->orWhere('summary', 'ilike', "%{$q}%");
            });
        }

        $guides = $query->paginate(min((int) $request->get('per_page', 20), 50));

        return response()->json([
            'data' => $guides->items(),
            'meta' => [
                'current_page' => $guides->currentPage(),
                'last_page' => $guides->lastPage(),
                'per_page' => $guides->perPage(),
                'total' => $guides->total(),
            ],
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $guide = NeedCostGuide::published()
            ->where('slug', $slug)
            ->with('category:id,name,slug')
            ->firstOrFail();

        return response()->json(['data' => $guide]);
    }

    /**
     * N-35 quote calculator: scaled estimate for a category, powered by
     * its published cost guide. 404 when no priced guide exists — an
     * estimate is never fabricated from nothing.
     */
    public function estimate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => ['required', 'uuid', 'exists:need_categories,id'],
            'quantity' => ['nullable', 'integer', 'min:1', 'max:1000'],
        ]);

        $result = \Modules\Needs\Services\QuoteEstimator::estimate(
            $validated['category_id'],
            (int) ($validated['quantity'] ?? 1),
        );

        if (! $result) {
            return response()->json([
                'message' => 'No cost estimate is available for this category yet',
            ], 404);
        }

        return response()->json(['data' => $result]);
    }
}
