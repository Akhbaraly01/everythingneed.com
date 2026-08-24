<?php

namespace Modules\Categories\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Categories\Entities\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Category::with('children');

        if ($request->has('parent_id')) {
            $query->where('parent_id', $request->parent_id);
        } elseif (!$request->boolean('all')) {
            $query->whereNull('parent_id');
        }

        if ($request->has('search')) {
            $query->where('name', 'ilike', "%{$request->search}%");
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $categories = $query->orderBy('sort_order')->orderBy('name')->get();

        return response()->json(['data' => $categories]);
    }

    public function tree(): JsonResponse
    {
        $categories = Category::with('children.children.children')
            ->whereNull('parent_id')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        return response()->json(['data' => $categories]);
    }

    public function show(string $id): JsonResponse
    {
        $category = Category::with(['children', 'parent'])->find($id);

        if (!$category) {
            return response()->json(['message' => 'Category not found'], 404);
        }

        return response()->json(['data' => $category]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'parent_id' => 'nullable|exists:categories,id',
            'icon' => 'nullable|string|max:100',
            'image_url' => 'nullable|url|max:500',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        $data = $request->only(['name', 'description', 'parent_id', 'icon', 'image_url', 'sort_order', 'is_active']);
        $data['slug'] = Str::slug($data['name']);

        if (!isset($data['is_active'])) {
            $data['is_active'] = true;
        }

        $category = Category::create($data);

        return response()->json([
            'message' => 'Category created successfully',
            'data' => $category,
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $category = Category::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:1000',
            'parent_id' => 'nullable|exists:categories,id',
            'icon' => 'nullable|string|max:100',
            'image_url' => 'nullable|url|max:500',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        $data = $request->only(['name', 'description', 'parent_id', 'icon', 'image_url', 'sort_order', 'is_active']);

        if (isset($data['name']) && $data['name'] !== $category->name) {
            $data['slug'] = Str::slug($data['name']);
        }

        $category->update($data);

        return response()->json([
            'message' => 'Category updated successfully',
            'data' => $category,
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $category = Category::findOrFail($id);

        if ($category->children()->count() > 0) {
            return response()->json(['message' => 'Cannot delete category with children. Remove children first.'], 422);
        }

        $category->delete();

        return response()->json(['message' => 'Category deleted successfully']);
    }
}
