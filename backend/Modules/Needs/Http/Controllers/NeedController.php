<?php

namespace Modules\Needs\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class NeedController extends Controller
{
    public function categories(): JsonResponse
    {
        $categories = DB::table('need_categories')
            ->orderBy('sort_order')
            ->get();

        return response()->json(['data' => $categories]);
    }

    public function items(Request $request): JsonResponse
    {
        $query = DB::table('need_items')->orderByDesc('created_at');

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $items = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $items->items(),
            'meta' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'category_id' => 'required|uuid|exists:need_categories,id',
            'price' => 'nullable|numeric|min:0',
            'image_url' => 'nullable|string|max:500',
        ]);

        $id = (string) Str::uuid();

        DB::table('need_items')->insert(array_merge($validated, [
            'id' => $id,
            'user_id' => $request->user()->id,
            'is_available' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]));

        return response()->json(['message' => 'Need published', 'data' => ['id' => $id]], 201);
    }

    public function show(string $id): JsonResponse
    {
        $item = DB::table('need_items')->find($id);

        if (!$item) {
            return response()->json(['message' => 'Need not found'], 404);
        }

        return response()->json(['data' => $item]);
    }
}
