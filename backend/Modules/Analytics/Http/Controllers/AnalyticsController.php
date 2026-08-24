<?php

namespace Modules\Analytics\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = DB::table('analytics_events')->orderByDesc('created_at');

        if ($request->has('type')) {
            $query->where('event_type', $request->type);
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        $events = $query->paginate($request->get('per_page', 20));

        return response()->json([
            'data' => $events->items(),
            'meta' => [
                'current_page' => $events->currentPage(),
                'last_page' => $events->lastPage(),
                'per_page' => $events->perPage(),
                'total' => $events->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'event_type' => 'required|string|max:100',
            'entity_type' => 'nullable|string|max:100',
            'entity_id' => 'nullable|string|max:100',
            'metadata' => 'nullable|array',
        ]);

        $event = DB::table('analytics_events')->insertGetId([
            'user_id' => $request->user()?->id,
            'event_type' => $request->event_type,
            'entity_type' => $request->entity_type,
            'entity_id' => $request->entity_id,
            'metadata' => json_encode($request->metadata),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json(['message' => 'Event tracked', 'id' => $event], 201);
    }

    public function summary(): JsonResponse
    {
        $totalEvents = DB::table('analytics_events')->count();
        $todayEvents = DB::table('analytics_events')->whereDate('created_at', today())->count();
        $uniqueUsers = DB::table('analytics_events')->distinct('user_id')->count('user_id');
        $topEventTypes = DB::table('analytics_events')
            ->select('event_type', DB::raw('count(*) as count'))
            ->groupBy('event_type')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        return response()->json([
            'data' => [
                'total_events' => $totalEvents,
                'today_events' => $todayEvents,
                'unique_users' => $uniqueUsers,
                'top_event_types' => $topEventTypes,
            ],
        ]);
    }
}
