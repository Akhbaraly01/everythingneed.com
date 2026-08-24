<?php

namespace Modules\JobSeekers\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\JobSeekers\Entities\WorkerProfile;

class WorkerProfileController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = WorkerProfile::query()
            ->with('user:id,name,email')
            ->search($request->get('q'), ['headline', 'bio', 'city']);

        if ($category = $request->get('category')) {
            $query->where('category', $category);
        }

        if ($city = $request->get('city')) {
            $query->where('city', 'ilike', "%{$city}%");
        }

        if ($availability = $request->get('availability')) {
            $query->where('availability', $availability);
        }

        if ($maxRate = $request->get('max_rate')) {
            $query->where(function ($q) use ($maxRate) {
                $q->where('hourly_rate', '<=', $maxRate)
                    ->orWhere('daily_rate', '<=', $maxRate)
                    ->orWhereNull('hourly_rate');
            });
        }

        match ($request->get('sort', 'rating')) {
            'rate_low' => $query->orderBy('hourly_rate'),
            'rate_high' => $query->orderByDesc('hourly_rate'),
            'newest' => $query->orderByDesc('created_at'),
            default => $query->orderByDesc('rating_avg')->orderByDesc('rating_count'),
        };

        if ($request->boolean('verified_only')) {
            $query->where('is_verified', true);
        }

        $workers = $query->paginate($request->get('per_page', 12));

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

    public function categories(): JsonResponse
    {
        $categories = WorkerProfile::query()
            ->select('category')
            ->selectRaw('count(*) as workers_count')
            ->groupBy('category')
            ->orderBy('category')
            ->get();

        return response()->json(['data' => $categories]);
    }

    public function show(string $id): JsonResponse
    {
        $worker = WorkerProfile::with('user:id,name,email')->find($id);

        if (!$worker) {
            return response()->json([
                'message' => 'Worker not found',
                'error' => 'The requested worker profile does not exist.',
            ], 404);
        }

        return response()->json(['data' => $worker]);
    }

    public function myProfile(Request $request): JsonResponse
    {
        $profile = WorkerProfile::withTrashed()
            ->where('user_id', $request->user()->id)
            ->first();

        return response()->json(['data' => $profile]);
    }

    public function store(Request $request): JsonResponse
    {
        $existing = WorkerProfile::withTrashed()
            ->where('user_id', $request->user()->id)
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'Worker profile already exists',
                'error' => 'You already have a worker profile.',
            ], 409);
        }

        $validated = $this->validateProfile($request);

        $profile = WorkerProfile::create($validated + ['user_id' => $request->user()->id]);

        return response()->json([
            'message' => 'Worker profile created',
            'data' => $profile,
        ], 201);
    }

    public function update(Request $request): JsonResponse
    {
        $profile = WorkerProfile::where('user_id', $request->user()->id)->first();

        if (!$profile) {
            return response()->json(['message' => 'Worker profile not found'], 404);
        }

        $validated = $this->validateProfile($request, updating: true);

        $profile->update($validated);

        return response()->json([
            'message' => 'Worker profile updated',
            'data' => $profile->fresh(),
        ]);
    }

    private function validateProfile(Request $request, bool $updating = false): array
    {
        $rules = [
            'headline' => [$updating ? 'sometimes' : 'required', 'string', 'max:160'],
            'bio' => ['nullable', 'string', 'max:5000'],
            'category' => [$updating ? 'sometimes' : 'required', 'string', 'max:80'],
            'skills' => ['nullable', 'array'],
            'experience' => ['nullable', 'array'],
            'education' => ['nullable', 'array'],
            'portfolio' => ['nullable', 'array'],
            'hourly_rate' => ['nullable', 'numeric', 'min:0'],
            'daily_rate' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'size:3'],
            'availability' => ['nullable', 'in:' . implode(',', WorkerProfile::AVAILABILITY)],
            'city' => ['nullable', 'string', 'max:120'],
            'country' => ['nullable', 'string', 'max:120'],
        ];

        return $request->validate($rules);
    }
}
