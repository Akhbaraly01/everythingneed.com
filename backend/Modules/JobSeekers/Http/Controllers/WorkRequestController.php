<?php

namespace Modules\JobSeekers\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\JobSeekers\Entities\WorkOffer;
use Modules\JobSeekers\Entities\WorkerProfile;
use Modules\JobSeekers\Entities\WorkRequest;

class WorkRequestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = WorkRequest::with(['workerProfile.user:id,name', 'offers'])
            ->where('requester_id', $request->user()->id)
            ->orderByDesc('created_at');

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        $requests = $query->paginate($request->get('per_page', 15));

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

    public function incoming(Request $request): JsonResponse
    {
        $profile = WorkerProfile::where('user_id', $request->user()->id)->first();

        if (!$profile) {
            return response()->json(['data' => [], 'meta' => ['total' => 0]]);
        }

        $requests = WorkRequest::with(['requester:id,name,email', 'offers'])
            ->where('worker_profile_id', $profile->id)
            ->whereIn('status', ['open', 'negotiating', 'accepted', 'paid'])
            ->orderByDesc('created_at')
            ->paginate($request->get('per_page', 15));

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

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'worker_profile_id' => ['nullable', 'uuid', 'exists:worker_profiles,id'],
            'title' => ['required', 'string', 'max:180'],
            'description' => ['nullable', 'string', 'max:10000'],
            'category' => ['required', 'string', 'max:80'],
            'location' => ['nullable', 'string', 'max:200'],
            'start_date' => ['nullable', 'date'],
            'estimated_duration' => ['nullable', 'string', 'max:80'],
            'budget_min' => ['nullable', 'numeric', 'min:0'],
            'budget_max' => ['nullable', 'numeric', 'min:0', 'gte:budget_min'],
            'currency' => ['nullable', 'string', 'size:3'],
            'workers_needed' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $workRequest = WorkRequest::create($validated + [
            'requester_id' => $request->user()->id,
            'status' => 'open',
        ]);

        return response()->json([
            'message' => 'Work request created',
            'data' => $workRequest->load('workerProfile'),
        ], 201);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $workRequest = WorkRequest::with([
            'workerProfile.user:id,name',
            'requester:id,name,email',
            'offers',
        ])->find($id);

        if (!$workRequest) {
            return response()->json(['message' => 'Work request not found'], 404);
        }

        $isOwner = $workRequest->requester_id === $request->user()?->id;
        $isTargetWorker = $workRequest->workerProfile
            && $request->user()
            && $workRequest->workerProfile->user_id === $request->user()->id;

        if (!$isOwner && !$isTargetWorker && !in_array($workRequest->status, ['open'])) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json(['data' => $workRequest]);
    }

    public function cancel(Request $request, string $id): JsonResponse
    {
        $workRequest = WorkRequest::where('requester_id', $request->user()->id)->find($id);

        if (!$workRequest) {
            return response()->json(['message' => 'Work request not found'], 404);
        }

        if (!in_array($workRequest->status, ['open', 'negotiating'])) {
            return response()->json([
                'message' => 'Cannot cancel',
                'error' => "A request in status '{$workRequest->status}' can no longer be cancelled.",
            ], 422);
        }

        $workRequest->update(['status' => 'cancelled']);

        return response()->json([
            'message' => 'Work request cancelled',
            'data' => $workRequest->fresh(),
        ]);
    }

    public function submitOffer(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'rate' => ['required', 'numeric', 'min:0'],
            'message' => ['nullable', 'string', 'max:2000'],
        ]);

        /** @var WorkRequest|null $workRequest */
        $workRequest = WorkRequest::find($id);

        if (!$workRequest || !in_array($workRequest->status, ['open', 'negotiating'])) {
            return response()->json(['message' => 'Work request not open for offers'], 404);
        }

        $profile = WorkerProfile::where('user_id', $request->user()->id)->first();

        if ($workRequest->worker_profile_id && $workRequest->worker_profile_id !== $profile?->id) {
            return response()->json(['message' => 'This request targets another worker'], 403);
        }

        if (!$workRequest->worker_profile_id && !$profile) {
            return response()->json([
                'message' => 'Worker profile required',
                'error' => 'Create a worker profile before submitting offers.',
            ], 422);
        }

        $offer = WorkOffer::create([
            'work_request_id' => $workRequest->id,
            'worker_profile_id' => $profile?->id,
            'proposed_by' => 'worker',
            'rate' => $validated['rate'],
            'message' => $validated['message'] ?? null,
        ]);

        $workRequest->update(['status' => 'negotiating']);

        return response()->json([
            'message' => 'Offer submitted',
            'data' => $offer,
        ], 201);
    }

    public function respondToOffer(Request $request, string $offerId): JsonResponse
    {
        $validated = $request->validate([
            'decision' => ['required', 'in:accept,reject'],
        ]);

        $offer = WorkOffer::with('workRequest')->find($offerId);

        if (!$offer) {
            return response()->json(['message' => 'Offer not found'], 404);
        }

        if ($offer->workRequest->requester_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($offer->status !== 'pending') {
            return response()->json(['message' => 'Offer already resolved'], 422);
        }

        $offer->update([
            'status' => $validated['decision'] === 'accept' ? 'accepted' : 'rejected',
        ]);

        if ($validated['decision'] === 'accept') {
            $offer->workRequest->update([
                'status' => 'accepted',
                'agreed_rate' => $offer->rate,
                'worker_profile_id' => $offer->worker_profile_id
                    ?? $offer->workRequest->worker_profile_id,
            ]);
        }

        return response()->json([
            'message' => 'Offer ' . $validated['decision'] . 'ed',
            'data' => $offer->fresh('workRequest'),
        ]);
    }

    public function markPaid(Request $request, string $id): JsonResponse
    {
        return $this->transition($request, $id, 'accepted', 'paid');
    }

    public function startProgress(Request $request, string $id): JsonResponse
    {
        return $this->transition($request, $id, 'paid', 'in_progress');
    }

    public function complete(Request $request, string $id): JsonResponse
    {
        $result = $this->transition($request, $id, 'in_progress', 'completed');

        if ($result->getStatusCode() === 200) {
            $workRequest = WorkRequest::find($id);
            if ($workRequest?->workerProfile && $workRequest->agreed_rate) {
                $workRequest->workerProfile->increment('completed_jobs');
            }
        }

        return $result;
    }

    public function rate(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:2000'],
        ]);

        $workRequest = WorkRequest::with('workerProfile')->find($id);

        if (!$workRequest) {
            return response()->json(['message' => 'Work request not found'], 404);
        }

        if ($workRequest->requester_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($workRequest->status !== 'completed') {
            return response()->json([
                'message' => 'Not rateable yet',
                'error' => 'Only completed work can be rated.',
            ], 422);
        }

        if (!$workRequest->workerProfile) {
            return response()->json(['message' => 'No worker attached to this request'], 422);
        }

        if ($workRequest->rated_at) {
            return response()->json(['message' => 'Already rated'], 409);
        }

        $workRequest->workerProfile->recordRating((int) $validated['rating']);
        $workRequest->forceFill(['rated_at' => now()])->save();

        return response()->json([
            'message' => 'Rating recorded',
            'data' => [
                'rating' => $validated['rating'],
                'worker_rating_avg' => $workRequest->workerProfile->fresh()->rating_avg,
                'worker_rating_count' => $workRequest->workerProfile->fresh()->rating_count,
            ],
        ]);
    }

    private function transition(Request $request, string $id, string $from, string $to): JsonResponse
    {
        $workRequest = WorkRequest::find($id);

        if (!$workRequest) {
            return response()->json(['message' => 'Work request not found'], 404);
        }

        $isOwner = $workRequest->requester_id === $request->user()->id;
        $profile = WorkerProfile::where('user_id', $request->user()->id)->first();
        $isWorker = $profile && $workRequest->worker_profile_id === $profile->id;

        // Requester controls payment; worker controls progress/completion.
        $allowed = match ($to) {
            'paid' => $isOwner,
            'in_progress', 'completed' => $isWorker,
            default => false,
        };

        if (!$allowed) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($workRequest->status !== $from) {
            return response()->json([
                'message' => 'Invalid transition',
                'error' => "Expected status '{$from}', found '{$workRequest->status}'.",
            ], 422);
        }

        $workRequest->update(['status' => $to]);

        return response()->json([
            'message' => "Status updated to {$to}",
            'data' => $workRequest->fresh(),
        ]);
    }
}
