<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Modules\Needs\Entities\NeedCostGuide;

/**
 * N-29 admin console: cost-guide CRUD. Reuses the needs.listings.*
 * permissions (discovery content adjacent to listings) so the
 * permission matrix stays tight.
 */
class AdminCostGuideController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = NeedCostGuide::with('category:id,name,slug')->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        if ($request->filled('q')) {
            $q = trim((string) $request->get('q'));
            $query->where(function ($sub) use ($q) {
                $sub->where('title', 'ilike', "%{$q}%")
                    ->orWhere('slug', 'ilike', "%{$q}%");
            });
        }

        $guides = $query->paginate(min((int) $request->get('per_page', 20), 100));

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

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validated($request);

        $guide = NeedCostGuide::create([
            ...$validated,
            'slug' => $validated['slug'] ?? Str::slug($validated['title']),
        ]);

        return response()->json(['message' => 'Cost guide created', 'data' => $guide->load('category:id,name,slug')], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $guide = NeedCostGuide::find($id);
        if (! $guide) {
            return response()->json(['message' => 'Cost guide not found'], 404);
        }

        $validated = $this->validated($request, $guide);

        $guide->update($validated);

        return response()->json(['message' => 'Cost guide updated', 'data' => $guide->fresh('category:id,name,slug')]);
    }

    public function destroy(string $id): JsonResponse
    {
        $guide = NeedCostGuide::find($id);
        if (! $guide) {
            return response()->json(['message' => 'Cost guide not found'], 404);
        }

        $guide->delete();

        return response()->json(['message' => 'Cost guide deleted']);
    }

    /**
     * Shared validation; price_min <= price_avg <= price_max when set.
     */
    private function validated(Request $request, ?NeedCostGuide $guide = null): array
    {
        $uniqueRule = $guide
            ? 'unique:need_cost_guides,slug,' . $guide->id
            : 'unique:need_cost_guides,slug';

        $validated = $request->validate([
            'need_category_id' => [$guide ? 'sometimes' : 'required', 'uuid', 'exists:need_categories,id'],
            'slug' => ['nullable', 'string', 'max:160', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $uniqueRule],
            'title' => [$guide ? 'sometimes' : 'required', 'string', 'max:180'],
            'summary' => [$guide ? 'sometimes' : 'required', 'string', 'max:4000'],
            'price_min' => ['nullable', 'numeric', 'min:0', 'max:10000000'],
            'price_max' => ['nullable', 'numeric', 'min:0', 'max:10000000'],
            'price_avg' => ['nullable', 'numeric', 'min:0', 'max:10000000'],
            'currency' => ['nullable', 'string', 'size:3'],
            'pricing_unit' => ['nullable', 'string', 'in:project,hour,visit,day,month'],
            'factors' => ['nullable', 'array', 'max:30'],
            'factors.*.label' => ['required_with:factors', 'string', 'max:160'],
            'factors.*.impact' => ['nullable', 'string', 'in:low,medium,high'],
            'faqs' => ['nullable', 'array', 'max:20'],
            'faqs.*.question' => ['required_with:faqs', 'string', 'max:300'],
            'faqs.*.answer' => ['required_with:faqs', 'string', 'max:2000'],
            'source_note' => ['nullable', 'string', 'max:300'],
            'status' => ['nullable', 'string', 'in:draft,published'],
        ]);

        $min = $validated['price_min'] ?? ($guide?->price_min);
        $max = $validated['price_max'] ?? ($guide?->price_max);
        $avg = $validated['price_avg'] ?? ($guide?->price_avg);

        if ($min !== null && $max !== null && (float) $min > (float) $max) {
            abort(response()->json(['message' => 'price_min cannot exceed price_max'], 422));
        }
        if ($avg !== null && $min !== null && (float) $avg < (float) $min) {
            abort(response()->json(['message' => 'price_avg cannot be below price_min'], 422));
        }
        if ($avg !== null && $max !== null && (float) $avg > (float) $max) {
            abort(response()->json(['message' => 'price_avg cannot exceed price_max'], 422));
        }

        return $validated;
    }
}
