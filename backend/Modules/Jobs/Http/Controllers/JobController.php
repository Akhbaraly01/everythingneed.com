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
        $query = JobPost::where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            });

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

        if ($request->boolean('mine') && $request->user()) {
            $query->where('user_id', $request->user()->id);
        }

        $jobs = $query->withCount('applications')
            ->with('companyProfile:id,name,slug')
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
        $job = JobPost::withCount('applications')
            ->with('companyProfile:id,name,slug,industry,location,website,logo_path')
            ->find($id);

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

        // N-32: attach the poster's company profile automatically so every
        // post links back to /companies/{slug}; the typed company string
        // remains what search and older clients read.
        $companyId = \Modules\Jobs\Entities\Company::where('user_id', $request->user()->id)
            ->where('is_active', true)
            ->value('id');

        $job = JobPost::create(array_merge($validated, [
            'user_id' => $request->user()->id,
            'company_id' => $companyId,
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

        if ($job->expires_at && $job->expires_at->isPast()) {
            return response()->json(['message' => 'This job posting has expired'], 422);
        }

        if ((string) $job->user_id === (string) $request->user()->id) {
            return response()->json(['message' => 'You cannot apply to your own job posting'], 422);
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
            'data' => array_map(fn ($a) => $this->applicationPayload($a), $applications->items()),
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
            'data' => array_map(fn ($a) => $this->applicationPayload($a), $applications->items()),
            'meta' => [
                'current_page' => $applications->currentPage(),
                'last_page' => $applications->lastPage(),
                'per_page' => $applications->perPage(),
                'total' => $applications->total(),
            ],
        ]);
    }

    /** One application: visible to the applicant and the job owner. */
    public function showApplication(Request $request, string $id): JsonResponse
    {
        $application = JobApplication::with(['jobPost', 'user'])->find($id);

        if (!$application) {
            return response()->json(['message' => 'Application not found'], 404);
        }

        $me = (string) $request->user()->id;
        $isApplicant = (string) $application->user_id === $me;
        $isOwner = (string) ($application->jobPost?->user_id ?? '') === $me;

        if (!$isApplicant && !$isOwner) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json(['data' => $this->applicationPayload($application)]);
    }

    /** Job owners move their applicants through the hiring pipeline. */
    public function updateApplication(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:pending,reviewed,shortlisted,rejected,hired',
        ]);

        $application = JobApplication::with('jobPost')->find($id);

        if (!$application) {
            return response()->json(['message' => 'Application not found'], 404);
        }

        if ((string) ($application->jobPost?->user_id ?? '') !== (string) $request->user()->id) {
            return response()->json(['message' => 'Only the job owner can update applications'], 403);
        }

        $application->update(['status' => $validated['status']]);

        return response()->json([
            'message' => 'Application updated',
            'data' => $this->applicationPayload($application->fresh()->load('jobPost')),
        ]);
    }

    /**
     * N-33: every application payload exposes the job under the codebase's
     * snake_case convention (frontend reads job_post, Eloquent emits
     * jobPost) — one mapper, all endpoints agree.
     */
    private function applicationPayload(object $application): array
    {
        $data = $application->toArray();

        if (array_key_exists('jobPost', $data)) {
            $data['job_post'] = $data['jobPost'];
            unset($data['jobPost']);
        }

        return $data;
    }

    /** Employer dashboard: own posts plus received-application counts. */
    public function profile(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $posts = JobPost::withCount('applications')
            ->where('user_id', $userId)
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => [
            'posts' => $posts,
            'total_posts' => $posts->count(),
            'active_posts' => $posts->where('is_active', true)->count(),
            'applications_received' => (int) $posts->sum('applications_count'),
        ]]);
    }

    /** Admin console: every application with job + applicant context. */
    public function adminApplications(Request $request): JsonResponse
    {
        $applications = JobApplication::with(['jobPost:id,title,company', 'user:id,name,email'])
            ->orderByDesc('created_at')
            ->paginate($request->get('per_page', 25));

        return response()->json([
            'data' => array_map(fn ($a) => $this->applicationPayload($a), $applications->items()),
            'meta' => [
                'current_page' => $applications->currentPage(),
                'last_page' => $applications->lastPage(),
                'per_page' => $applications->perPage(),
                'total' => $applications->total(),
            ],
        ]);
    }

    /**
     * Admin console: every job post including inactive/expired (public hides them).
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $query = JobPost::query()->orderByDesc('created_at');

        if ($request->filled('q')) {
            $q = $request->q;
            $query->where(fn ($sub) => $sub->where('title', 'ilike', "%{$q}%")->orWhere('company', 'ilike', "%{$q}%"));
        }
        if (in_array($request->get('status', 'all'), ['active', 'inactive'], true)) {
            $query->where('is_active', $request->get('status') === 'active');
        }

        $jobs = $query->paginate($request->get('per_page', 25));

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

    /**
     * Admin console: full edit of a job post. Every field is optional, but
     * at least one change must be present (the is_active toggle rides here).
     *
     * PUT /api/admin/jobs/{id} (role: super_admin, administrator, jobs_admin)
     */
    public function adminUpdate(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string|max:10000',
            'company' => 'sometimes|string|max:255',
            'location' => 'sometimes|string|max:255',
            'job_type' => 'sometimes|string|in:full_time,part_time,contract,internship,temporary',
            'salary_min' => 'sometimes|nullable|numeric|min:0',
            'salary_max' => 'sometimes|nullable|numeric|min:0',
            'currency' => 'sometimes|nullable|string|size:3',
            'requirements' => 'sometimes|nullable|array',
            'benefits' => 'sometimes|nullable|array',
            'expires_at' => 'sometimes|nullable|date',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($data === []) {
            return response()->json(['message' => 'No changes provided'], 422);
        }

        $job = JobPost::find($id);
        if (!$job) {
            return response()->json(['message' => 'Job not found'], 404);
        }

        $job->update($data);

        try {
            app(\Core\Services\Contracts\AuditServiceInterface::class)->log([
                'action' => 'update',
                'entity_type' => 'job_post',
                'entity_id' => $job->id,
                'performed_by' => $request->user()?->id,
                'new_values' => ['fields' => array_keys($data)],
            ]);
        } catch (\Throwable) {
            // Audit failures must not break edits.
        }

        return response()->json([
            'message' => 'Job updated successfully',
            'data' => $job->fresh(),
        ]);
    }

    /**
     * Admin console: delete a job post (soft delete). Refused while
     * applications exist so applicant history stays intact.
     *
     * DELETE /api/admin/jobs/{id} (role: super_admin, administrator, jobs_admin)
     */
    public function adminDestroy(Request $request, string $id): JsonResponse
    {
        $job = JobPost::find($id);
        if (!$job) {
            return response()->json(['message' => 'Job not found'], 404);
        }

        if ($job->applications()->exists()) {
            return response()->json([
                'message' => 'This job has applications and cannot be deleted. Deactivate it instead.',
            ], 422);
        }

        $title = $job->title;
        $job->delete();

        try {
            app(\Core\Services\Contracts\AuditServiceInterface::class)->log([
                'action' => 'delete',
                'entity_type' => 'job_post',
                'entity_id' => $id,
                'performed_by' => $request->user()?->id,
                'new_values' => ['title' => $title],
            ]);
        } catch (\Throwable) {
            // Audit failures must not break deletion.
        }

        return response()->json(['message' => 'Job deleted']);
    }
}
