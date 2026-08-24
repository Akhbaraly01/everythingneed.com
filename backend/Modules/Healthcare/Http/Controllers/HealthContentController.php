<?php

namespace Modules\Healthcare\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Healthcare\Entities\HealthContent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HealthContentController extends Controller
{
    private const TYPES = [
        'videos' => 'video',
        'documents' => 'document',
        'categories' => 'category',
        'prevention-guides' => 'prevention_guide',
    ];

    public function index(Request $request, string $type): JsonResponse
    {
        $mapped = self::TYPES[$type] ?? null;

        if (!$mapped) {
            return response()->json(['message' => "Unknown health content type '{$type}'"], 404);
        }

        $query = HealthContent::where('type', $mapped)->where('is_active', true);

        if ($request->filled('specialty')) {
            $query->where('specialty', $request->specialty);
        }

        if ($request->filled('q')) {
            $q = $request->q;
            $query->where(function ($sub) use ($q) {
                $sub->where('title', 'ilike', "%{$q}%")
                    ->orWhere('summary', 'ilike', "%{$q}%");
            });
        }

        $content = $query->orderByDesc('created_at')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $content->items(),
            'meta' => [
                'current_page' => $content->currentPage(),
                'last_page' => $content->lastPage(),
                'per_page' => $content->perPage(),
                'total' => $content->total(),
            ],
        ]);
    }

    public function show(string $type, string $id): JsonResponse
    {
        $mapped = self::TYPES[$type] ?? null;

        if (!$mapped) {
            return response()->json(['message' => "Unknown health content type '{$type}'"], 404);
        }

        $content = HealthContent::where('type', $mapped)->find($id);

        if (!$content) {
            return response()->json(['message' => 'Content not found'], 404);
        }

        return response()->json(['data' => $content]);
    }
}
