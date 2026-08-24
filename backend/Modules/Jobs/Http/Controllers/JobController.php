<?php

namespace Modules\Jobs\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Jobs\Entities\JobPost;
use Modules\Jobs\Entities\JobApplication;
use Core\Exceptions\NotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JobController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = JobPost::where('is_active', true);

        if ($request->filled('job_type')) {
            $query->where('job_type', $request->job_type);
        }

        if ($request->filled('location')) {
            $query->where('location', 'ilike', "%{$request->location}%");
        }

        if ($request->filled('q')) {
            $q = $request->q;
            $query->where(function ($sub) use ($q) {
                $sub->where('title', 'ilike', "%{$q}%")
                    ->orWhere('company', 'ilike', "%{$q}%")
                    ->orWhere('description', 'ilike', "%{$q}%");
            });
        }

        if ($request->boolean('mine')) {
            $query->where('user_id', $request->user()->id);
        }

        $jobs = $query->withCount('applications')
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $jobs->items(),
            'meta' => [
                'current_page' => $jobs->currentPage(),
                'last_page' => $jobs->lastPage(),
                'per_page' => $jobs->perPage(),
                'total' => $jobs->total(),
            ],
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $job = JobPost::withCount('applications')->find($id);

        if (!$job) {
            return response()->json(['message' => 'Job not found'], 404);
        }

        return response()->json(['data' => $job]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:10000',
            'company' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'job_type' => 'required|string|in:full_time,part_time,contract,internship,temporary',
            'salary_min' => 'nullable|numeric|min:0',
            'salary_max' => 'nullable|numeric|min:0|gte:salary_min',
            'currency' => 'nullable|string|size:3',
            'requirements' => 'nullable|array',
            'benefits' => 'nullable|array',
            'expires_at' => 'nullable|date|after:now',
        ]);

        $job = JobPost::create(array_merge($validated, [
            'user_id' => $request->user()->id,
            'is_active' => true,
        ]));

        return response()->json([
            'message' => 'Job posted successfully',
            'data' => $job,
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $job = JobPost::find($id);

        if (!$job) {
            throw new NotFoundException('Job', $id);
        }

        if ($job->user_id !== $request->user()->id) {
            return response()->json(['message' => 'You do not own this job posting'], 403);
        }

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string|max:10000',
            'company' => 'sometimes|string|max:255',
            'location' => 'sometimes|string|max:255',
            'job_type' => 'sometimes|string|in:full_time,part_time,contract,internship,temporary',
            'salary_min' => 'nullable|numeric|min:0',
            'salary_max' => 'nullable|numeric|min:0|gte:salary_min',
            'is_active' => 'sometimes|boolean',
            'requirements' => 'nullable|array',
            'benefits' => 'nullable|array',
        ]);

        $job->update($validated);

        return response()->json([
            'message' => 'Job updated successfully',
            'data' => $job->fresh(),
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $job = JobPost::find($id);

        if (!$job) {
            throw new NotFoundException('Job', $id);
        }

        if ($job->user_id !== $request->user()->id) {
            return response()->json(['message' => 'You do not own this job posting'], 403);
        }

        $job->update(['is_active' => false]);

        return response()->json(['message' => 'Job closed successfully']);
    }

    public function apply(Request $request, string $jobId): JsonResponse
    {
        $job = JobPost::find($jobId);

        if (!$job || !$job->is_active) {
            throw new NotFoundException('Job', $jobId);
        }

        $existing = JobApplication::where('job_post_id', $jobId)
            ->where('user_id', $request->user()->id)
            ->first();

        if ($existing) {
            return response()->json(['message' => 'You have already applied to this job'], 409);
        }

        $application = JobApplication::create([
            'job_post_id' => $jobId,
            'user_id' => $request->user()->id,
            'cover_letter' => $request->get('cover_letter'),
            'resume_url' => $request->get('resume_url'),
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Application submitted successfully',
            'data' => $application,
        ], 201);
    }

    public function applications(Request $request, string $id): JsonResponse
    {
        $job = JobPost::find($id);

        if (!$job) {
            throw new NotFoundException('Job', $id);
        }

        if ($job->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Only the job owner can view applications'], 403);
        }

        $applications = JobApplication::with(['jobPost', 'user'])
            ->where('job_post_id', $id)
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $applications->items(),
            'meta' => [
                'current_page' => $applications->currentPage(),
                'last_page' => $applications->lastPage(),
                'per_page' => $applications->perPage(),
                'total' => $applications->total(),
            ],
        ]);
    }

    public function myApplications(Request $request): JsonResponse
    {
        $applications = JobApplication::with('jobPost')
            ->where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $applications->items(),
            'meta' => [
                'current_page' => $applications->currentPage(),
                'last_page' => $applications->lastPage(),
                'per_page' => $applications->perPage(),
                'total' => $applications->total(),
            ],
        ]);
    }
}
