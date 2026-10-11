<?php

namespace Modules\Search\Http\Controllers;

use App\Http\Controllers\Controller;
use Core\Services\Contracts\SearchServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    /** Spec §49 — unified discovery types (plus "all"). */
    private const TYPES = [
        'all', 'products', 'categories', 'services', 'needs', 'doctors',
        'courses', 'experts', 'vendors', 'jobs', 'hotels', 'restaurants',
        'properties', 'agriculture', 'building',
    ];

    public function __construct(private SearchServiceInterface $search) {}

    public function index(Request $request): JsonResponse
    {
        $query = $request->get('q', '');

        if (strlen($query) < 2) {
            return response()->json(['message' => 'Search query must be at least 2 characters'], 422);
        }

        $type = $request->get('type', 'all');

        if (!in_array($type, self::TYPES, true)) {
            return response()->json([
                'message' => 'Invalid search type.',
                'errors' => ['type' => ['The selected type is invalid.']],
            ], 422);
        }

        $results = $this->search->discover($query, $type);

        return response()->json([
            'data' => $results,
            'query' => $query,
            'type' => $type,
            'types' => array_values(array_slice(self::TYPES, 1)),
        ]);
    }
}
