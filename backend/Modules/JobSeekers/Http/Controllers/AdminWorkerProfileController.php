<?php

namespace Modules\JobSeekers\Http\Controllers;

use App\Http\Controllers\Controller;
use Core\Services\Contracts\AuditServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\JobSeekers\Entities\WorkerProfile;

class AdminWorkerProfileController extends Controller
{
    private const ACTIVE_REQUEST_STATUSES = [
        'open', 'negotiating', 'accepted', 'paid', 'in_progress', 'disputed',
    ];

    public function index(Request $request): JsonResponse
    {
        $query = WorkerProfile::query()
            ->with('user:id,name,email')
            ->withCount('workRequests');

        if ($request->boolean('include_deleted')) {
            $query->withTrashed();
        }

        if ($q = trim((string) $request->get('q'))) {
            $query->where(function ($search) use ($q) {
                $search->where('headline', 'ilike', "%{$q}%")
                    ->orWhere('category', 'ilike', "%{$q}%")
                    ->orWhere('city', 'ilike', "%{$q}%")
                    ->orWhereHas('user', fn ($user) => $user
                        ->where('name', 'ilike', "%{$q}%")
                        ->orWhere('email', 'ilike', "%{$q}%"));
            });
        }

        if ($category = $request->get('category')) {
            $query->where('category', $category);
        }

        if ($availability = $request->get('availability')) {
            $query->where('availability', $availability);
        }

        if ($request->has('verified') && $request->get('verified') !== '') {
            $query->where('is_verified', $request->boolean('verified'));
        }

        $sort = $request->get('sort', 'newest');
        match ($sort) {
            'rating' => $query->orderByDesc('rating_avg')->orderByDesc('rating_count'),
            'rate_low' => $query->orderBy('hourly_rate'),
            'rate_high' => $query->orderByDesc('hourly_rate'),
            default => $query->orderByDesc('created_at'),
        };

        $perPage = min(max((int) $request->get('per_page', 25), 1), 100);
        $workers = $query->paginate($perPage);

        return response()->json([
            'data' => $workers->items(),
            'meta' => [
                'current_page' => $workers->currentPage(),
                'last_page' => $workers->lastPage(),
                'per_page' => $workers->perPage(),
                'total' => $workers->total(),
            ],
        ]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'is_verified' => ['required', 'boolean'],
        ]);

        $profile = WorkerProfile::withTrashed()->find($id);
        if (!$profile) {
            return response()->json(['message' => 'Worker profile not found'], 404);
        }

        $profile->update(['is_verified' => $data['is_verified']]);

        $this->audit($request, $data['is_verified'] ? 'verify' : 'unverify', $profile);

        return response()->json([
            'message' => $data['is_verified'] ? 'Worker verified' : 'Worker verification removed',
            'data' => $profile->fresh()->load('user:id,name,email'),
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $profile = WorkerProfile::find($id);
        if (!$profile) {
            return response()->json(['message' => 'Worker profile not found'], 404);
        }

        $activeRequests = $profile->workRequests()
            ->whereIn('status', self::ACTIVE_REQUEST_STATUSES)
            ->count();

        if ($activeRequests > 0) {
            return response()->json([
                'message' => 'Worker has active work requests',
                'error' => 'Resolve or cancel the active work requests before removing this profile.',
            ], 422);
        }

        $profile->delete();
        $this->audit($request, 'delete', $profile);

        return response()->json(['message' => 'Worker profile removed']);
    }

    public function restore(Request $request, string $id): JsonResponse
    {
        $profile = WorkerProfile::withTrashed()->find($id);
        if (!$profile) {
            return response()->json(['message' => 'Worker profile not found'], 404);
        }

        if (!$profile->trashed()) {
            return response()->json(['message' => 'Worker profile is not deleted'], 422);
        }

        $profile->restore();
        $this->audit($request, 'restore', $profile);

        return response()->json([
            'message' => 'Worker profile restored',
            'data' => $profile->fresh()->load('user:id,name,email'),
        ]);
    }

    private function audit(Request $request, string $action, WorkerProfile $profile): void
    {
        try {
            app(AuditServiceInterface::class)->log([
                'action' => $action,
                'entity_type' => 'worker_profile',
                'entity_id' => $profile->id,
                'performed_by' => $request->user()?->id,
                'new_values' => ['is_verified' => $profile->is_verified],
            ]);
        } catch (\Throwable) {
            // Audit failures must not break moderation.
        }
    }
}
