<?php

namespace Modules\JobSeekers\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\JobSeekers\Entities\WorkRequest;

class AdminWorkRequestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = WorkRequest::query()
            ->with([
                'requester:id,name,email',
                'workerProfile:id,user_id,headline,category',
                'workerProfile.user:id,name,email',
            ])
            ->withCount('offers');

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        if ($category = $request->get('category')) {
            $query->where('category', $category);
        }

        if ($q = trim((string) $request->get('q'))) {
            $query->where(function ($search) use ($q) {
                $search->where('title', 'ilike', "%{$q}%")
                    ->orWhere('location', 'ilike', "%{$q}%")
                    ->orWhere('category', 'ilike', "%{$q}%")
                    ->orWhereHas('requester', fn ($user) => $user
                        ->where('name', 'ilike', "%{$q}%")
                        ->orWhere('email', 'ilike', "%{$q}%"));
            });
        }

        if ($request->boolean('disputed_only')) {
            $query->where('status', 'disputed');
        }

        if ($request->boolean('include_deleted')) {
            $query->withTrashed();
        }

        $query->orderByDesc('created_at');

        $perPage = min(max((int) $request->get('per_page', 25), 1), 100);
        $requests = $query->paginate($perPage);

        return response()->json([
            'data' => $requests->items(),
            'meta' => [
                'current_page' => $requests->currentPage(),
                'last_page' => $requests->lastPage(),
                'per_page' => $requests->perPage(),
                'total' => $requests->total(),
            ],
        ]);
    }
}
