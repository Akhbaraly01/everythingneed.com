<?php

namespace Modules\Pharmacy\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Pharmacy\Entities\Medicine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MedicineController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Medicine::query();

        if ($request->has('search')) {
            $query->where('name', 'ilike', "%{$request->search}%");
        }

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        $medicines = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $medicines->items(),
            'meta' => [
                'current_page' => $medicines->currentPage(),
                'last_page' => $medicines->lastPage(),
                'per_page' => $medicines->perPage(),
                'total' => $medicines->total(),
            ],
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $medicine = Medicine::with(['vendor'])->find($id);

        if (!$medicine) {
            return response()->json(['message' => 'Medicine not found'], 404);
        }

        return response()->json([
            'data' => $medicine,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'price' => 'required|numeric|min:0',
            'stock' => 'nullable|integer|min:0',
            'stock_quantity' => 'nullable|integer|min:0',
            'category' => 'required|string|max:100',
            'dosage_form' => 'nullable|string|max:100',
            'strength' => 'nullable|string|max:100',
            'manufacturer' => 'nullable|string|max:255',
            'vendor_id' => 'nullable|uuid|exists:vendors,id',
            'image_url' => 'nullable|url|max:500',
            'requires_prescription' => 'nullable|boolean',
        ]);

        // The legacy `stock` alias maps onto the real stock_quantity column.
        if (!isset($validated['stock_quantity']) && isset($validated['stock'])) {
            $validated['stock_quantity'] = $validated['stock'];
        }
        unset($validated['stock']);

        $medicine = Medicine::create($validated);

        return response()->json([
            'message' => 'Medicine created successfully',
            'data' => $medicine,
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $medicine = Medicine::find($id);

        if (!$medicine) {
            return response()->json(['message' => 'Medicine not found'], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'generic_name' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:2000',
            'price' => 'sometimes|numeric|min:0',
            'stock' => 'sometimes|integer|min:0',
            'stock_quantity' => 'sometimes|integer|min:0',
            'category' => 'sometimes|string|max:100',
            'dosage_form' => 'nullable|string|max:100',
            'strength' => 'nullable|string|max:100',
            'manufacturer' => 'nullable|string|max:255',
            'vendor_id' => 'nullable|uuid|exists:vendors,id',
            'image_url' => 'nullable|url|max:500',
            'requires_prescription' => 'sometimes|boolean',
        ]);

        if (!isset($validated['stock_quantity']) && isset($validated['stock'])) {
            $validated['stock_quantity'] = $validated['stock'];
        }
        unset($validated['stock']);

        if ($validated === []) {
            return response()->json(['message' => 'No changes provided'], 422);
        }

        $medicine->update($validated);

        try {
            app(\Core\Services\Contracts\AuditServiceInterface::class)->log([
                'action' => 'update',
                'entity_type' => 'medicine',
                'entity_id' => $id,
                'performed_by' => $request->user()?->id,
                'new_values' => $validated,
            ]);
        } catch (\Throwable) {
            // Audit failures must not break the update.
        }

        return response()->json([
            'message' => 'Medicine updated successfully',
            'data' => $medicine->fresh(),
        ]);
    }

    /**
     * Admin console: remove a medicine from the catalogue. Soft delete so
     * historic order items keep resolving; refused while order items exist.
     *
     * DELETE /api/medicines/{id} (role: super_admin, administrator, pharmacy_admin)
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $medicine = Medicine::find($id);

        if (!$medicine) {
            return response()->json(['message' => 'Medicine not found'], 404);
        }

        if ($medicine->orderItems()->exists()) {
            return response()->json([
                'message' => 'This medicine has orders and cannot be deleted. Set stock to zero instead.',
            ], 422);
        }

        $name = $medicine->name;
        $medicine->delete();

        try {
            app(\Core\Services\Contracts\AuditServiceInterface::class)->log([
                'action' => 'delete',
                'entity_type' => 'medicine',
                'entity_id' => $id,
                'performed_by' => $request->user()?->id,
                'new_values' => ['name' => $name],
            ]);
        } catch (\Throwable) {
            // Audit failures must not break deletion.
        }

        return response()->json(['message' => 'Medicine deleted']);
    }
}
