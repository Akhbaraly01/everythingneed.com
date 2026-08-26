<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Modules\Products\Entities\Brand;

class AdminBrandController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $brands = Brand::query()
            ->when($request->get('search'), fn ($q, $s) => $q->where('name', 'ilike', "%{$s}%"))
            ->orderBy('name')
            ->paginate($request->get('per_page', 25));

        return response()->json([
            'data' => $brands->items(),
            'meta' => [
                'current_page' => $brands->currentPage(),
                'last_page' => $brands->lastPage(),
                'total' => $brands->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'logo_url' => 'nullable|string|max:500',
            'is_active' => 'boolean',
        ]);

        $brand = Brand::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'logo_url' => $request->logo_url,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return response()->json(['data' => $brand], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $brand = Brand::find($id);
        if (!$brand) {
            return response()->json(['message' => 'Brand not found'], 404);
        }

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'logo_url' => 'nullable|string|max:500',
            'is_active' => 'boolean',
        ]);

        if ($request->has('name')) {
            $brand->slug = Str::slug($request->name);
        }

        $brand->fill($request->only(['name', 'logo_url', 'is_active']));
        $brand->save();

        return response()->json(['data' => $brand]);
    }

    public function destroy(string $id): JsonResponse
    {
        $brand = Brand::find($id);
        if (!$brand) {
            return response()->json(['message' => 'Brand not found'], 404);
        }

        $brand->delete();

        return response()->json(['message' => 'Brand deleted']);
    }
}
