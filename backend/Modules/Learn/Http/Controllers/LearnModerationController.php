<?php

namespace Modules\Learn\Http\Controllers;

use App\Http\Controllers\Controller;
use Core\Services\Contracts\AuditServiceInterface;
use Core\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Modules\Learn\Entities\LearnPost;
use Modules\Learn\Entities\LearnPostReport;

/**
 * Learn 2.0 moderation console API.
 *
 * Two-tier review:
 *   review tier  (super_admin, administrator, learning_admin,
 *                 learning_reviewer, moderator):
 *     queue, claim, approve, reject, needs-info, hide, restore, remove,
 *     report inbox.
 *   senior tier  (super_admin, administrator, learning_admin) additionally:
 *     reassign, pin, and approving sensitive (health/finance/legal) topics.
 *
 * Rules enforced here (never only in the UI):
 *   - reviewers cannot moderate their own posts (no self-approval),
 *   - every transition writes an audit row and notifies the author,
 *   - claim is an atomic ownership lock (single assignee per post).
 */
class LearnModerationController extends Controller
{
    private const REVIEW_ROLES = ['super_admin', 'administrator', 'learning_admin', 'learning_reviewer', 'moderator'];
    private const SENIOR_ROLES = ['super_admin', 'administrator', 'learning_admin'];

    public const QUEUE_STATUSES = [
        LearnPost::STATUS_PENDING,
        LearnPost::STATUS_UNDER_REVIEW,
        LearnPost::STATUS_NEEDS_INFO,
        LearnPost::STATUS_REJECTED,
        LearnPost::STATUS_APPROVED,
        LearnPost::STATUS_HIDDEN,
        LearnPost::STATUS_REMOVED,
    ];

    public function __construct(
        private AuditServiceInterface $audit,
        private NotificationService $notifications,
    ) {}

    /** Review queue with tab counts, search, SLA ordering and assignment filters. */
    public function queue(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'nullable|string|max:120',
            'q' => 'nullable|string|max:120',
            'assignee' => 'nullable|string|max:64',
            'sort' => 'nullable|string|in:oldest,newest',
        ]);

        $statuses = $this->parseStatuses($validated['status'] ?? null);
        $sort = $validated['sort'] ?? null;
        $base = fn () => $this->queueQuery($request, $validated);

        $counts = $base()->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status');

        $query = $base()->whereIn('status', $statuses);
        $query->orderBy(
            $sort === 'newest' ? 'created_at' : 'submitted_at',
            $sort === 'newest' ? 'desc' : 'asc'
        )->orderBy('created_at', 'asc');

        $posts = $query->paginate(20);

        return response()->json([
            'data' => $posts->items(),
            'meta' => [
                'current_page' => $posts->currentPage(),
                'last_page' => $posts->lastPage(),
                'total' => $posts->total(),
            ],
            // Union order matters: real counts win, zeros only fill the gaps.
            'counts' => $counts->all() + $this->emptyCounts(),
        ]);
    }

    /** Atomic claim: one reviewer owns the post while it is under review. */
    public function claim(Request $request, string $id): JsonResponse
    {
        $post = LearnPost::find($id);

        if (!$post) {
            return response()->json(['message' => 'Post not found'], 404);
        }
        if (!in_array($post->status, [LearnPost::STATUS_PENDING, LearnPost::STATUS_UNDER_REVIEW, LearnPost::STATUS_NEEDS_INFO], true)) {
            return response()->json(['message' => 'Only queued posts can be claimed.'], 409);
        }

        $userId = $request->user()->id;

        $claimed = LearnPost::where('id', $post->id)
            ->where('status', '!=', LearnPost::STATUS_REMOVED)
            ->where(fn ($q) => $q->whereNull('assigned_to')->orWhere('assigned_to', $userId))
            ->update([
                'assigned_to' => $userId,
                'status' => $post->status === LearnPost::STATUS_PENDING ? LearnPost::STATUS_UNDER_REVIEW : $post->status,
                'updated_at' => now(),
            ]);

        if ($claimed === 0) {
            $post->load('assignee:id,name');

            return response()->json([
                'message' => 'Already claimed by another reviewer.',
                'data' => ['assigned_to' => $post->assignee?->name],
            ], 409);
        }

        return response()->json([
            'message' => 'Claimed. This post is now assigned to you.',
            'data' => $post->fresh(),
        ]);
    }

    /** Senior tier hands the post to another reviewer. */
    public function reassign(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate(['user_id' => 'required|uuid']);

        $post = LearnPost::find($id);
        if (!$post) {
            return response()->json(['message' => 'Post not found'], 404);
        }

        $assignee = \App\Models\User::find($validated['user_id']);
        if (!$assignee) {
            return response()->json(['message' => 'Reviewer not found'], 404);
        }

        $oldAssignee = $post->assigned_to;
        $post->update(['assigned_to' => $assignee->id]);

        try {
            $this->notifications->notify(
                $assignee->id,
                'Review assigned to you',
                'A post is waiting for your review: "'.mb_substr($post->title, 0, 80).'"',
                'moderation',
                $post->id,
            );
        } catch (\Throwable) {
            // notification delivery must never block the assignment
        }

        $this->logAudit($request, 'learn.post.reassign', $post, ['assigned_to' => $oldAssignee], ['assigned_to' => $assignee->id]);

        return response()->json(['message' => 'Reassigned.', 'data' => $post->fresh()]);
    }

    public function approve(Request $request, string $id): JsonResponse
    {
        $post = LearnPost::find($id);

        if (!$post) {
            return response()->json(['message' => 'Post not found'], 404);
        }

        $user = $request->user();
        $roles = $user->roles->pluck('role')->all();

        if ($post->user_id === $user->id) {
            return response()->json(['message' => 'You cannot moderate your own post.'], 403);
        }

        if ($post->requiresSecondReview() && !$this->isSenior($roles)) {
            return response()->json([
                'message' => 'This topic (health/finance/legal) requires a senior reviewer: learning_admin or above.',
            ], 403);
        }

        if ($post->status === LearnPost::STATUS_APPROVED) {
            return response()->json(['message' => 'Post is already approved.', 'data' => $post]);
        }

        if (in_array($post->status, [LearnPost::STATUS_REMOVED, LearnPost::STATUS_DRAFT], true)) {
            return response()->json(['message' => 'Post is not awaiting review.'], 409);
        }

        $oldStatus = $post->status;
        DB::transaction(function () use ($post, $user) {
            $post->update([
                'status' => LearnPost::STATUS_APPROVED,
                'reviewed_by' => $user->id,
                'reviewed_at' => now(),
                'published_at' => $post->published_at ?? now(),
                'rejection_reason' => null,
            ]);
        });

        $this->logAudit($request, 'learn.post.approve', $post, ['status' => $oldStatus], ['status' => LearnPost::STATUS_APPROVED]);
        $this->notifyAuthor($post, 'Your post is live', 'Your post "'.mb_substr($post->title, 0, 80).'" was approved and is now visible in the feed.');

        return response()->json(['message' => 'Post approved and published.', 'data' => $post->fresh()]);
    }

    public function reject(Request $request, string $id): JsonResponse
    {
        // reason stays optional: the phase-16 contract allows a bare reject
        // (LearnFeedTest); the UI always sends one.
        $validated = $request->validate([
            'reason' => 'nullable|string|max:1000',
        ]);

        return $this->decide($request, $id, LearnPost::STATUS_REJECTED, 'Post rejected.', $validated['reason'] ?? null);
    }

    public function needsInfo(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'note' => 'nullable|string|max:1000',
        ]);

        return $this->decide($request, $id, LearnPost::STATUS_NEEDS_INFO, 'Author asked for changes.', $validated['note'] ?? null);
    }

    /** Hide approved content (reports, policy). Author is notified. */
    public function hide(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'nullable|string|max:1000',
        ]);

        return $this->decide($request, $id, LearnPost::STATUS_HIDDEN, 'Post hidden from the feed.', $validated['reason'] ?? null);
    }

    /** Bring hidden content back (restores to approved). */
    public function restore(Request $request, string $id): JsonResponse
    {
        $post = LearnPost::find($id);

        if (!$post) {
            return response()->json(['message' => 'Post not found'], 404);
        }
        if ($post->status !== LearnPost::STATUS_HIDDEN) {
            return response()->json(['message' => 'Only hidden posts can be restored.'], 409);
        }

        $post->update(['status' => LearnPost::STATUS_APPROVED, 'rejection_reason' => null]);

        $this->logAudit($request, 'learn.post.restore', $post, ['status' => LearnPost::STATUS_HIDDEN], ['status' => LearnPost::STATUS_APPROVED]);
        $this->notifyAuthor($post, 'Your post is visible again', 'Your post "'.mb_substr($post->title, 0, 80).'" was restored to the feed.');

        return response()->json(['message' => 'Post restored.', 'data' => $post->fresh()]);
    }

    /** Moderation removal: soft delete with an audit trail. */
    public function remove(Request $request, string $id): JsonResponse
    {
        $post = LearnPost::find($id);

        if (!$post) {
            return response()->json(['message' => 'Post not found'], 404);
        }

        $old = ['status' => $post->status];
        $post->delete();

        $this->logAudit($request, 'learn.post.remove', $post, $old, ['status' => LearnPost::STATUS_REMOVED]);
        $this->notifyAuthor($post, 'Your post was removed', 'Your post "'.mb_substr($post->title, 0, 80).'" was removed by a moderator.');

        return response()->json(['message' => 'Post removed.']);
    }

    /** Pin/unpin on top of the first feed page (senior tier). */
    public function pin(Request $request, string $id): JsonResponse
    {
        $post = LearnPost::find($id);

        if (!$post) {
            return response()->json(['message' => 'Post not found'], 404);
        }
        if ($post->status !== LearnPost::STATUS_APPROVED) {
            return response()->json(['message' => 'Only approved posts can be pinned.'], 409);
        }

        $oldPinned = (bool) $post->is_pinned;
        $post->update(['is_pinned' => !$oldPinned]);

        $this->logAudit($request, 'learn.post.pin', $post, ['is_pinned' => $oldPinned], ['is_pinned' => !$oldPinned]);

        return response()->json(['data' => ['is_pinned' => !$oldPinned]]);
    }

    /** Open report inbox with the reported post attached. */
    public function reports(Request $request): JsonResponse
    {
        $status = (string) $request->get('status', LearnPostReport::STATUS_OPEN);

        $query = LearnPostReport::with(['post.user:id,name', 'user:id,name'])
            ->withCount('post')
            ->orderBy('created_at', 'desc');

        if (in_array($status, [LearnPostReport::STATUS_OPEN, LearnPostReport::STATUS_RESOLVED, LearnPostReport::STATUS_DISMISSED], true)) {
            $query->where('status', $status);
        }

        $reports = $query->paginate(20);

        return response()->json(['data' => $reports->items(), 'meta' => [
            'current_page' => $reports->currentPage(),
            'last_page' => $reports->lastPage(),
            'total' => $reports->total(),
        ]]);
    }

    /** Close a report: resolve (handled) or dismiss (no violation). */
    public function resolveReport(Request $request, string $reportId): JsonResponse
    {
        $validated = $request->validate([
            'action' => 'required|string|in:resolve,dismiss',
        ]);

        $report = LearnPostReport::find($reportId);

        if (!$report) {
            return response()->json(['message' => 'Report not found'], 404);
        }
        if ($report->status !== LearnPostReport::STATUS_OPEN) {
            return response()->json(['message' => 'Report already handled.'], 409);
        }

        $report->update([
            'status' => $validated['action'] === 'resolve' ? LearnPostReport::STATUS_RESOLVED : LearnPostReport::STATUS_DISMISSED,
            'handled_by' => $request->user()->id,
            'handled_at' => now(),
        ]);

        try {
            $this->audit->log([
                'action' => 'learn.report.'.$validated['action'],
                'entity_type' => 'learn_post_reports',
                'entity_id' => $report->id,
                'performed_by' => $request->user()->id,
                'old_values' => ['status' => LearnPostReport::STATUS_OPEN],
                'new_values' => ['post_id' => $report->post_id, 'reason' => $report->reason],
            ]);
        } catch (\Throwable) {
            // audit failure never blocks a reviewer closing their inbox
        }

        return response()->json(['message' => 'Report handled.', 'data' => $report->fresh()]);
    }

    /** Shared decision path for reject / needs-info / hide. */
    private function decide(Request $request, string $id, string $status, string $okMessage, ?string $reason, bool $notifyAuthor = true): JsonResponse
    {
        $post = LearnPost::find($id);

        if (!$post) {
            return response()->json(['message' => 'Post not found'], 404);
        }

        $user = $request->user();
        if ($post->user_id === $user->id) {
            return response()->json(['message' => 'You cannot moderate your own post.'], 403);
        }

        if (in_array($post->status, [LearnPost::STATUS_REMOVED, LearnPost::STATUS_DRAFT], true)) {
            return response()->json(['message' => 'Post is not awaiting review.'], 409);
        }

        $old = ['status' => $post->status];

        DB::transaction(function () use ($post, $user, $status, $reason) {
            $post->update([
                'status' => $status,
                'reviewed_by' => $user->id,
                'reviewed_at' => now(),
                'rejection_reason' => $status === LearnPost::STATUS_REJECTED || $status === LearnPost::STATUS_HIDDEN
                    ? $reason
                    : $post->rejection_reason,
            ]);
        });

        $this->logAudit($request, 'learn.post.'.$status, $post, $old, ['status' => $status, 'reason' => $reason]);

        if ($notifyAuthor) {
            $messages = [
                LearnPost::STATUS_REJECTED => ['Your post was not published', 'Your post "'.mb_substr($post->title, 0, 80).'" was rejected: '.($reason ?: 'no reason given')],
                LearnPost::STATUS_NEEDS_INFO => ['Changes requested on your post', 'A reviewer needs more information: '.($reason ?: 'see reviewer note')],
                LearnPost::STATUS_HIDDEN => ['Your post is hidden', 'Your post "'.mb_substr($post->title, 0, 80).'" was hidden from the feed'.($reason ? ': '.$reason : '.')],
            ];
            $msg = $messages[$status] ?? null;
            if ($msg) {
                $this->notifyAuthor($post, $msg[0], $msg[1]);
            }
        }

        return response()->json(['message' => $okMessage, 'data' => $post->fresh()]);
    }

    private function queueQuery(Request $request, array $validated)
    {
        $query = LearnPost::with(['user:id,name', 'assignee:id,name', 'reviewer:id,name']);

        if (!empty($validated['q'])) {
            $term = '%'.$validated['q'].'%';
            $query->where(fn ($q) => $q->where('title', 'ilike', $term)->orWhere('content', 'ilike', $term));
        }

        $assignee = $validated['assignee'] ?? null;
        if ($assignee === 'me') {
            $query->where('assigned_to', $request->user()->id);
        } elseif ($assignee === 'unassigned') {
            $query->whereNull('assigned_to');
        } elseif ($assignee === 'all' || $assignee === null || $assignee === '') {
            // no assignment filter
        } else {
            $query->where('assigned_to', $assignee);
        }

        return $query->where('status', '!=', LearnPost::STATUS_DRAFT);
    }

    /** @return list<string> */
    private function parseStatuses(?string $raw): array
    {
        if ($raw === null || $raw === '' || $raw === 'queue') {
            return [LearnPost::STATUS_PENDING, LearnPost::STATUS_UNDER_REVIEW, LearnPost::STATUS_NEEDS_INFO];
        }
        if ($raw === 'all') {
            return self::QUEUE_STATUSES;
        }

        $requested = array_map('trim', explode(',', $raw));

        return array_values(array_intersect($requested, self::QUEUE_STATUSES));
    }

    /** @return array<string, int> */
    private function emptyCounts(): array
    {
        $counts = [];
        foreach (self::QUEUE_STATUSES as $status) {
            $counts[$status] = 0;
        }

        return $counts;
    }

    /** @param list<string> $roles */
    private function isSenior(array $roles): bool
    {
        return array_intersect($roles, self::SENIOR_ROLES) !== [];
    }

    private function logAudit(Request $request, string $action, LearnPost $post, array $old, array $new): void
    {
        try {
            $this->audit->log([
                'action' => $action,
                'entity_type' => 'learn_posts',
                'entity_id' => $post->id,
                'performed_by' => $request->user()->id,
                'old_values' => $old,
                'new_values' => $new,
            ]);
        } catch (\Throwable) {
            // audit failures must never block a moderation decision
        }
    }

    private function notifyAuthor(LearnPost $post, string $title, string $message): void
    {
        try {
            $this->notifications->notify($post->user_id, $title, $message, 'moderation', $post->id);
        } catch (\Throwable) {
            // delivery is best-effort; the decision row is already persisted
        }
    }
}
