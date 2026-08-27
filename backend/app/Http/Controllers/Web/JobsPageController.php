<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Jobs\Entities\JobPost;

class JobsPageController extends Controller
{
    public function index(Request $request): Response
    {
        $query = JobPost::where('is_active', true);

        if ($search = trim((string) $request->query('search'))) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'ilike', "%{$search}%")
                    ->orWhere('company', 'ilike', "%{$search}%")
                    ->orWhere('location', 'ilike', "%{$search}%");
            });
        }

        if ($type = trim((string) $request->query('type'))) {
            $query->where('job_type', 'ilike', $type);
        }

        $jobs = $query->orderByDesc('created_at')->paginate(20)->withQueryString();

        return Inertia::render('jobs/Index', [
            'jobs' => $jobs,
            'filters' => $request->only(['search', 'type']),
        ]);
    }

    public function show(string $id): Response
    {
        $job = JobPost::where('is_active', true)->findOrFail($id);

        return Inertia::render('jobs/Show', [
            'job' => $job,
        ]);
    }
}
