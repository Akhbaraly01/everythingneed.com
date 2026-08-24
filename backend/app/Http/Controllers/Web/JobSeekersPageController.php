<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\JobSeekers\Entities\WorkerProfile;
use Modules\JobSeekers\Entities\WorkRequest;

class JobSeekersPageController extends Controller
{
    public function index(Request $request): Response
    {
        $query = WorkerProfile::query()->with('user:id,name,email');

        if ($q = trim((string) $request->query('q'))) {
            $query->where(function ($w) use ($q) {
                $w->where('headline', 'ilike', "%{$q}%")
                    ->orWhere('bio', 'ilike', "%{$q}%")
                    ->orWhere('city', 'ilike', "%{$q}%");
            });
        }

        if ($category = $request->query('category')) {
            $query->where('category', $category);
        }

        if ($availability = $request->query('availability')) {
            $query->where('availability', $availability);
        }

        if ($city = $request->query('city')) {
            $query->where('city', 'ilike', "%{$city}%");
        }

        match ($request->query('sort', 'rating')) {
            'rate_low' => $query->orderBy('hourly_rate'),
            'rate_high' => $query->orderByDesc('hourly_rate'),
            'newest' => $query->orderByDesc('created_at'),
            default => $query->orderByDesc('rating_avg')->orderByDesc('rating_count'),
        };

        $workers = $query->paginate(12)->withQueryString();

        $categories = WorkerProfile::select('category')
            ->selectRaw('count(*) as workers_count')
            ->groupBy('category')
            ->orderBy('category')
            ->get();

        return Inertia::render('job-seekers/Index', [
            'workers' => $workers,
            'categories' => $categories,
            'filters' => $request->only(['q', 'category', 'availability', 'city', 'sort']),
        ]);
    }

    public function show(Request $request, string $id): Response
    {
        $worker = WorkerProfile::with('user:id,name,email')->findOrFail($id);

        return Inertia::render('job-seekers/Show', [
            'worker' => $worker,
        ]);
    }

    public function createRequest(Request $request, string $workerId): Response
    {
        $worker = WorkerProfile::with('user:id,name')->findOrFail($workerId);

        return Inertia::render('job-seekers/CreateRequest', [
            'worker' => $worker,
        ]);
    }

    public function myRequests(Request $request): Response
    {
        $requests = WorkRequest::with(['workerProfile.user:id,name', 'offers'])
            ->where('requester_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->paginate(15);

        return Inertia::render('job-seekers/MyRequests', [
            'requests' => $requests,
        ]);
    }
}
