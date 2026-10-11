<?php

namespace Modules\Analytics\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function __construct(private \Core\Services\Contracts\ReportingServiceInterface $reporting) {}

    public function index(Request $request): JsonResponse
    {
        $query = DB::table('analytics_events')->orderByDesc('created_at');

        $privileged = $request->user()->hasPermission('analytics.overview.view');

        if ($request->has('type')) {
            $query->where('event_type', $request->type);
        }

        if ($privileged) {
            if ($request->has('user_id')) {
                $query->where('user_id', $request->user_id);
            }
        } else {
            // Non-privileged callers only ever see their own events, and
            // never network identifiers.
            $query->where('user_id', $request->user()->id);
        }

        $events = $query->paginate($request->get('per_page', 20));

        $items = collect($events->items())->map(function ($event) use ($privileged) {
            $event = (array) $event;

            if (!$privileged) {
                unset($event['ip_address'], $event['user_agent']);
            }

            return $event;
        })->values();

        return response()->json([
            'data' => $items,
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

        $id = (string) \Illuminate\Support\Str::uuid();
        DB::table('analytics_events')->insert([
            'id' => $id,
            'user_id' => $request->user()?->id,
            'event_type' => $request->event_type,
            'entity_type' => $request->entity_type,
            'entity_id' => $request->entity_id,
            'properties' => json_encode($request->metadata),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json(['message' => 'Event tracked', 'id' => $id], 201);
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

    /**
     * Signed-in customer's own analytics ("My Analytics" page).
     * No admin permission required — every query is scoped to the caller.
     * Cross-module aggregates (orders, wishlist) come from the Core
     * reporting contract; only analytics_events is read directly.
     */
    public function mySummary(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $stats = $this->reporting->userStats($userId);

        $recentViews = (int) DB::table('analytics_events')
            ->where('user_id', $userId)
            ->where('created_at', '>=', now()->subDays(30))
            ->count();

        return response()->json([
            'data' => [
                'total_orders'    => $stats['total_orders'],
                'total_spent'     => $stats['total_spent'],
                'total_wishlist'  => $stats['wishlist_count'],
                'orders_by_month' => $stats['orders_by_month'],
                'recent_views'    => $recentViews,
            ],
        ]);
    }
}
