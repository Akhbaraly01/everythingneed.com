<?php

namespace Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Inventory\Entities\StockLevel;
use Modules\Inventory\Entities\StockMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StockController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = StockLevel::with('product');

        if ($request->has('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        if ($request->has('low_stock') && $request->boolean('low_stock')) {
            $query->whereColumn('quantity', '<=', 'reorder_point');
        }

        $stocks = $query->orderBy('product_id')->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $stocks->items(),
            'meta' => [
                'current_page' => $stocks->currentPage(),
                'last_page' => $stocks->lastPage(),
                'per_page' => $stocks->perPage(),
                'total' => $stocks->total(),
            ],
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $stock = StockLevel::with('product')->find($id);

        if (!$stock) {
            return response()->json(['message' => 'Stock level not found'], 404);
        }

        return response()->json(['data' => $stock]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'quantity' => 'required|integer|min:0',
            'reserved_quantity' => 'integer|min:0',
            'reorder_point' => 'integer|min:0',
        ]);

        $stock = StockLevel::findOrFail($id);
        $stock->update($request->only(['quantity', 'reserved_quantity', 'reorder_point']));

        return response()->json([
            'message' => 'Stock updated successfully',
            'data' => $stock,
        ]);
    }

    public function movements(Request $request): JsonResponse
    {
        $query = StockMovement::with('product');

        if ($request->has('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        $movements = $query->latest()->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $movements->items(),
            'meta' => [
                'current_page' => $movements->currentPage(),
                'last_page' => $movements->lastPage(),
                'per_page' => $movements->perPage(),
                'total' => $movements->total(),
            ],
        ]);
    }

    public function productMovements(Request $request, string $id): JsonResponse
    {
        $stock = StockLevel::find($id);

        if (!$stock) {
            return response()->json(['message' => 'Stock level not found'], 404);
        }

        $movements = StockMovement::with('product')
            ->where('product_id', $stock->product_id)
            ->latest()
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $movements->items(),
            'meta' => [
                'current_page' => $movements->currentPage(),
                'last_page' => $movements->lastPage(),
                'per_page' => $movements->perPage(),
                'total' => $movements->total(),
            ],
        ]);
    }

    public function adjust(Request $request): JsonResponse
    {
        $request->validate([
            'product_id' => 'required|uuid',
            'type' => 'required|in:in,out,adjustment',
            'quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string|max:500',
        ]);

        $stock = StockLevel::firstOrCreate(
            ['product_id' => $request->product_id],
            ['quantity' => 0, 'reserved_quantity' => 0, 'reorder_point' => 0]
        );

        match ($request->type) {
            'in' => $stock->increment('quantity', $request->quantity),
            'out' => $stock->decrement('quantity', $request->quantity),
            'adjustment' => $stock->update(['quantity' => $request->quantity]),
        };

        StockMovement::create([
            'product_id' => $request->product_id,
            'type' => $request->type,
            'quantity' => $request->quantity,
            'notes' => $request->notes,
        ]);

        return response()->json([
            'message' => 'Stock adjusted successfully',
            'data' => $stock->fresh(),
        ]);
    }
}
