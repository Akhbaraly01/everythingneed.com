<?php

namespace Modules\Needs\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * TODO 18 saved items (§6.6): listings and searches. Provider saves arrive
 * with the public provider directory (TODO 19) — the shape already allows
 * them (item_type is open, rows resolve per type).
 */
class SavedItemController extends Controller
{
    public const TYPES = ['listing', 'search'];

    /**
     * GET /api/needs/saved — the caller's collection with resolved titles.
     */
    public function index(Request $request): JsonResponse
    {
        $rows = DB::table('need_saved_items')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->limit(100)
            ->get();

        $listingIds = $rows->where('item_type', 'listing')->pluck('item_id')->all();
        $listings = $listingIds === []
            ? collect()
            : \Modules\Needs\Entities\NeedItem::whereIn('id', $listingIds)
                ->get(['id', 'name', 'price', 'status', 'is_available'])
                ->keyBy('id');

        $data = $rows->map(fn ($row) => [
            'id' => $row->id,
            'item_type' => $row->item_type,
            'item_id' => $row->item_id,
            'query' => $row->query ? json_decode($row->query, true) : null,
            'created_at' => $row->created_at,
            'listing' => $row->item_type === 'listing' ? ($listings->get($row->item_id) ?? null) : null,
        ])->all();

        return response()->json(['data' => $data]);
    }

    /**
     * POST /api/needs/saved — idempotent: re-saving returns the row.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'item_type' => ['required', 'string', \Illuminate\Validation\Rule::in(self::TYPES)],
            'item_id' => ['nullable', 'uuid'],
            'query' => ['nullable', 'array'],
        ]);

        if ($validated['item_type'] === 'listing') {
            if (empty($validated['item_id'])) {
                return response()->json(['message' => 'A listing id is required'], 422);
            }
            $listing = \Modules\Needs\Entities\NeedItem::find($validated['item_id']);
            if (! $listing || ! $listing->isPubliclyVisible()) {
                return response()->json(['message' => 'Listing not found'], 404);
            }
        }

        if ($validated['item_type'] === 'search' && empty($validated['query'])) {
            return response()->json(['message' => 'A search query is required'], 422);
        }

        $row = DB::table('need_saved_items')
            ->where('user_id', $request->user()->id)
            ->where('item_type', $validated['item_type'])
            ->where('item_id', $validated['item_id'] ?? null)
            ->first();

        // Saved items must not bypass visibility: listings resolve live, so
        // unpublished rows simply show as unavailable in the collection.
        if (! $row) {
            $id = (string) \Illuminate\Support\Str::uuid();
            DB::table('need_saved_items')->insert([
                'id' => $id,
                'user_id' => $request->user()->id,
                'item_type' => $validated['item_type'],
                'item_id' => $validated['item_id'] ?? null,
                'query' => isset($validated['query']) ? json_encode($validated['query']) : null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $row = DB::table('need_saved_items')->where('id', $id)->first();
        }

        return response()->json(['message' => 'Saved', 'data' => $row], 201);
    }

    /**
     * DELETE /api/needs/saved/{id} — own rows only.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $deleted = DB::table('need_saved_items')
            ->where('id', $id)
            ->where('user_id', $request->user()->id)
            ->delete();

        if (! $deleted) {
            return response()->json(['message' => 'Saved item not found'], 404);
        }

        return response()->json(['message' => 'Removed']);
    }
}
