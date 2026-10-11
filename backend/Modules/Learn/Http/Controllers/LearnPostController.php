<?php

namespace Modules\Learn\Http\Controllers;

use App\Http\Controllers\Controller;
use Core\Services\Contracts\AuditServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Modules\Learn\Entities\LearnCommentLike;
use Modules\Learn\Entities\LearnFollow;
use Modules\Learn\Entities\LearnPost;
use Modules\Learn\Entities\LearnPostComment;
use Modules\Learn\Entities\LearnPostLike;
use Modules\Learn\Entities\LearnPostReport;
use Modules\Learn\Entities\LearnPostSave;
use Modules\Learn\Entities\LearnVideoView;
use Modules\Learn\Support\VideoResolver;

/**
 * Learn 2.0 knowledge feed - user-facing API.
 *
 * Submission lifecycle (moderation lives in LearnModerationController):
 *   draft -> pending -> (reviewer) approved | needs_information | rejected
 *   rejected --appeal--> pending
 * Only `approved` posts are publicly readable, which keeps the phase-16
 * contract (pending/rejected invisible) intact. Videos are resolved to
 * provider + id at submit time; unsupported hosts are rejected with 422.
 */
class LearnPostController extends Controller
{
    public function __construct(private AuditServiceInterface $audit) {}

    private const MAX_PER_PAGE = 30;

    /** Public feed: approved posts only. */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => 'nullable|string|max:120',
            'sort' => 'nullable|string|in:latest,top,trending',
            'type' => 'nullable|string|in:text,image,video',
            'category' => 'nullable|string|max:100',
            'author' => 'nullable|string|max:64',
            'cursor' => 'nullable|string|max:120',
            'per_page' => 'nullable|integer|min:1|max:'.self::MAX_PER_PAGE,
        ]);

        $sort = $validated['sort'] ?? 'latest';
        $perPage = min((int) ($validated['per_page'] ?? 15), self::MAX_PER_PAGE);
        $page = max(1, (int) $request->get('page', 1));

        $query = LearnPost::with('user:id,name')
            ->where('status', LearnPost::STATUS_APPROVED);

        if (!empty($validated['q'])) {
            $term = '%'.$validated['q'].'%';
            $query->where(fn ($q) => $q->where('title', 'ilike', $term)->orWhere('content', 'ilike', $term));
        }
        if (!empty($validated['type'])) {
            $query->where('media_type', $validated['type']);
        }
        if (!empty($validated['category'])) {
            $query->where('category', $validated['category']);
        }
        if (!empty($validated['author'])) {
            $query->where('user_id', $validated['author']);
        }

        // Deterministic order: every sort carries the uuid7 tiebreaker so
        // keyset pages never skip or repeat rows.
        if ($sort === 'top') {
            $query->orderByDesc('likes_count')->orderByDesc('id');
        } elseif ($sort === 'trending') {
            $query->orderByDesc('views_count')
                ->orderByDesc('likes_count')
                ->orderByDesc('id');
        } else {
            // Pinned posts lead the first page only - the cursor path must
            // stay a pure (created_at, id) keyset.
            if (empty($validated['cursor'])) {
                $query->orderByDesc('is_pinned');
            }
            $query->orderByDesc('created_at')->orderByDesc('id');
        }

        if (!empty($validated['cursor'])) {
            $this->applyCursor($query, $validated['cursor'], $sort);
        } elseif ($page > 1) {
            // Offset fallback: trending carries a computed ordering, so it
            // pages by number instead of a keyset cursor.
            $query->skip(($page - 1) * $perPage);
        }

        $rows = $query->take($perPage + 1)->get();
        $hasMore = $rows->count() > $perPage;
        $rows = $rows->take($perPage)->values();

        $nextCursor = null;
        if ($hasMore && $rows->isNotEmpty() && $sort !== 'trending') {
            $last = $rows->last();
            $nextCursor = $sort === 'top'
                ? base64_encode(json_encode(['k' => 'top', 'v' => (int) $last->likes_count, 'i' => $last->id]))
                : base64_encode(json_encode(['k' => 'lat', 'v' => $last->created_at->getTimestamp(), 'i' => $last->id]));
        }

        return response()->json([
            'data' => $rows,
            'meta' => [
                'per_page' => $perPage,
                'has_more' => $hasMore,
                'next_cursor' => $nextCursor,
                'sort' => $sort,
                'page' => $page,
            ],
        ]);
    }

    /** Keyset predicate for latest/top cursors. */
    private function applyCursor($query, string $cursor, string $sort): void
    {
        $decoded = json_decode(base64_decode($cursor, true) ?: '', true);

        if (!is_array($decoded) || ($decoded['k'] ?? '') !== ($sort === 'top' ? 'top' : 'lat')) {
            // Cursor from another sort (or corrupt) - drop it rather than
            // return a wrong page; the caller restarts from page one.
            return;
        }

        $value = (int) ($decoded['v'] ?? 0);
        $id = (string) ($decoded['i'] ?? '');

        if ($sort === 'top') {
            $query->where(function ($q) use ($value, $id) {
                $q->where('likes_count', '<', $value)
                    ->orWhere(fn ($qq) => $qq->where('likes_count', $value)->where('id', '<', $id));
            });
        } else {
            $ts = \Illuminate\Support\Carbon::createFromTimestamp($value);
            $query->where(function ($q) use ($ts, $value, $id) {
                $q->where('created_at', '<', $ts)
                    ->orWhere(fn ($qq) => $qq->where('created_at', $ts)->where('id', '<', $id));
            });
        }
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $post = LearnPost::with('user:id,name')->find($id);

        if (!$post || !$post->isPublic()) {
            return response()->json(['message' => 'Post not found'], 404);
        }

        $payload = $post->toArray();
        $user = $request->user('sanctum');
        if ($user) {
            $payload['viewer'] = [
                'liked' => LearnPostLike::where('post_id', $post->id)->where('user_id', $user->id)->exists(),
                'saved' => LearnPostSave::where('post_id', $post->id)->where('user_id', $user->id)->exists(),
                'following' => LearnFollow::where('follower_id', $user->id)->where('creator_id', $post->user_id)->exists(),
            ];
        }

        return response()->json(['data' => $payload]);
    }

    /** Submit for review (or save as draft). */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string|max:10000',
            'category' => 'nullable|string|max:100',
            'media_type' => 'nullable|string|in:text,image,video',
            'media_url' => 'nullable|url|max:1000',
            'thumbnail_url' => 'nullable|url|max:1000',
            'video_url' => 'required_if:media_type,video|nullable|url|max:1000',
            'duration_seconds' => 'nullable|integer|min:1|max:86400',
            'language' => 'nullable|string|max:10',
            'license' => 'nullable|string|max:40',
            'save_as_draft' => 'nullable|boolean',
        ]);

        $mediaType = $validated['media_type'] ?? 'text';
        $video = null;

        if ($mediaType === 'video') {
            $video = VideoResolver::resolve($validated['video_url'] ?? null);
            if ($video === null) {
                return response()->json([
                    'message' => 'Unsupported video source. Use a YouTube, Vimeo or Facebook link, or upload the file first.',
                ], 422);
            }
        }

        $user = $request->user();
        // learn_posts.category is NOT NULL - unnamed posts fall back to
        // 'general' instead of failing the insert.
        $rawCategory = $validated['category'] ?? null;
        $category = is_string($rawCategory) && trim($rawCategory) !== ''
            ? strip_tags($rawCategory)
            : 'general';
        $isDraft = (bool) ($validated['save_as_draft'] ?? false);

        $post = LearnPost::create([
            'user_id' => $user->id,
            'title' => strip_tags($validated['title']),
            'content' => strip_tags($validated['content']),
            'category' => $category,
            'media_type' => $mediaType,
            'media_url' => $validated['media_url'] ?? ($mediaType === 'video' ? $validated['video_url'] : null),
            'thumbnail_url' => $validated['thumbnail_url'] ?? null,
            'video_url' => $mediaType === 'video' ? $validated['video_url'] : null,
            'video_provider' => $video['provider'] ?? null,
            'provider_video_id' => $video['provider_video_id'] ?? null,
            'duration_seconds' => $validated['duration_seconds'] ?? null,
            'language' => $validated['language'] ?? null,
            'license' => $validated['license'] ?? null,
            'sensitive_topic' => $this->isSensitive($category),
            'slug' => $this->uniqueSlug($validated['title']),
            'author_name' => $user->name,
            'status' => $isDraft ? LearnPost::STATUS_DRAFT : LearnPost::STATUS_PENDING,
            'submitted_at' => $isDraft ? null : now(),
            'views_count' => 0,
        ]);

        return response()->json([
            'message' => $isDraft
                ? 'Draft saved. Nothing is visible to anyone but you.'
                : 'Post submitted for review. It becomes visible once approved.',
            'data' => $post,
        ], 201);
    }

    /** Owner edit: drafts/rejected/needs-info can change + (re)submit. */
    public function update(Request $request, string $id): JsonResponse
    {
        $post = LearnPost::find($id);

        if (!$post) {
            return response()->json(['message' => 'Post not found'], 404);
        }
        if ($post->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        if (in_array($post->status, [LearnPost::STATUS_UNDER_REVIEW, LearnPost::STATUS_APPROVED], true)) {
            return response()->json([
                'message' => 'This post is in review or published; wait for the reviewer decision first.',
            ], 409);
        }

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'content' => 'sometimes|required|string|max:10000',
            'category' => 'sometimes|nullable|string|max:100',
            'media_type' => 'sometimes|nullable|string|in:text,image,video',
            'media_url' => 'sometimes|nullable|url|max:1000',
            'thumbnail_url' => 'sometimes|nullable|url|max:1000',
            'video_url' => 'sometimes|nullable|url|max:1000',
            'duration_seconds' => 'sometimes|nullable|integer|min:1|max:86400',
            'resubmit' => 'sometimes|boolean',
        ]);

        $attrs = [];
        foreach (['title', 'content', 'media_type', 'media_url', 'thumbnail_url', 'video_url', 'duration_seconds'] as $key) {
            if (array_key_exists($key, $validated)) {
                $attrs[$key] = in_array($key, ['title', 'content'], true)
                    ? strip_tags($validated[$key])
                    : $validated[$key];
            }
        }

        if (array_key_exists('category', $validated)) {
            $rawCategory = $validated['category'];
            $attrs['category'] = is_string($rawCategory) && trim($rawCategory) !== ''
                ? strip_tags($rawCategory)
                : 'general';
        }

        if (array_key_exists('video_url', $validated) && ($attrs['media_type'] ?? $post->media_type) === 'video') {
            $video = VideoResolver::resolve($attrs['video_url'] ?? $post->video_url);
            if ($video === null) {
                return response()->json(['message' => 'Unsupported video source.'], 422);
            }
            $attrs['video_provider'] = $video['provider'];
            $attrs['provider_video_id'] = $video['provider_video_id'];
        }

        if (array_key_exists('category', $validated)) {
            $attrs['sensitive_topic'] = $this->isSensitive($validated['category']);
        }

        // Leaving review (rejected / needs-information) resubmits to the
        // queue by default; drafts stay drafts unless explicitly resubmitted.
        $wasInReview = in_array($post->status, [LearnPost::STATUS_REJECTED, LearnPost::STATUS_NEEDS_INFO], true);
        $resubmit = (bool) ($validated['resubmit'] ?? $wasInReview);
        if ($post->status === LearnPost::STATUS_DRAFT && !$resubmit) {
            // draft stays draft
        } elseif ($resubmit || $post->status === LearnPost::STATUS_PENDING) {
            $attrs['status'] = LearnPost::STATUS_PENDING;
            $attrs['submitted_at'] = now();
            $attrs['rejection_reason'] = null;
            $attrs['appeal_reason'] = null;
            $attrs['assigned_to'] = null;
        }

        $post->update($attrs);

        return response()->json([
            'message' => $post->fresh()->status === LearnPost::STATUS_PENDING
                ? 'Changes saved and resubmitted for review.'
                : 'Draft updated.',
            'data' => $post->fresh(),
        ]);
    }

    /** Own submissions in any status (paginated page mode). */
    public function mine(Request $request): JsonResponse
    {
        $query = LearnPost::where('user_id', $request->user()->id);

        if ($request->filled('status')) {
            $query->where('status', (string) $request->get('status'));
        }

        $posts = $query->orderByDesc('created_at')->paginate(15);

        return response()->json(['data' => $posts->items(), 'meta' => [
            'current_page' => $posts->currentPage(),
            'last_page' => $posts->lastPage(),
            'total' => $posts->total(),
        ]]);
    }

    /** Owner or reviewer removes a post (soft delete + audit). */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $post = LearnPost::find($id);

        if (!$post) {
            return response()->json(['message' => 'Post not found'], 404);
        }

        $user = $request->user();
        $roles = $user->roles->pluck('role')->all();
        $isReviewer = array_intersect($roles, ['super_admin', 'administrator', 'learning_admin', 'learning_reviewer', 'moderator']) !== [];

        if ($post->user_id !== $user->id && !$isReviewer) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $post->delete();

        try {
            $this->audit->log([
                'action' => 'learn.post.delete',
                'entity_type' => 'learn_posts',
                'entity_id' => $post->id,
                'performed_by' => $user->id,
                'old_values' => ['status' => $post->status],
            ]);
        } catch (\Throwable) {
            // audit never blocks the caller's own delete
        }

        return response()->json(['message' => 'Post deleted.']);
    }

    public function toggleLike(Request $request, string $id): JsonResponse
    {
        $post = LearnPost::find($id);

        if (!$post || !$post->isPublic()) {
            return response()->json(['message' => 'Post not found'], 404);
        }

        $liked = false;
        try {
            DB::transaction(function () use ($request, $post, &$liked) {
                $existing = LearnPostLike::where('post_id', $post->id)
                    ->where('user_id', $request->user()->id)
                    ->first();

                if ($existing) {
                    $existing->delete();
                    $post->decrement('likes_count');
                } else {
                    LearnPostLike::create(['post_id' => $post->id, 'user_id' => $request->user()->id]);
                    $post->increment('likes_count');
                    $liked = true;
                }
            });
        } catch (\Illuminate\Database\QueryException $e) {
            // Concurrent double-tap: the unique (post,user) index collapses
            // the race - the post is liked exactly once either way.
            if ((string) ($e->errorInfo[0] ?? '') === '23505') {
                $liked = true;
            } else {
                throw $e;
            }
        }

        return response()->json(['data' => ['liked' => $liked, 'likes_count' => (int) $post->fresh()->likes_count]]);
    }

    /** Save/collect a post for later (toggle). */
    public function toggleSave(Request $request, string $id): JsonResponse
    {
        $post = LearnPost::find($id);

        if (!$post || !$post->isPublic()) {
            return response()->json(['message' => 'Post not found'], 404);
        }

        $userId = $request->user()->id;
        $existing = LearnPostSave::where('post_id', $post->id)->where('user_id', $userId)->first();

        if ($existing) {
            $existing->delete();

            return response()->json(['data' => ['saved' => false]]);
        }

        try {
            LearnPostSave::create(['post_id' => $post->id, 'user_id' => $userId]);
        } catch (\Illuminate\Database\QueryException $e) {
            if ((string) ($e->errorInfo[0] ?? '') !== '23505') {
                throw $e;
            }
        }

        return response()->json(['data' => ['saved' => true]]);
    }

    /** The caller's saved posts. */
    public function saved(Request $request): JsonResponse
    {
        $posts = LearnPost::with('user:id,name')
            ->whereIn('id', LearnPostSave::where('user_id', $request->user()->id)->select('post_id'))
            ->where('status', LearnPost::STATUS_APPROVED)
            ->orderByDesc('created_at')
            ->paginate(15);

        return response()->json(['data' => $posts->items(), 'meta' => [
            'current_page' => $posts->currentPage(),
            'last_page' => $posts->lastPage(),
            'total' => $posts->total(),
        ]]);
    }

    /** Report abusive/inaccurate content (one report per user per post). */
    public function report(Request $request, string $id): JsonResponse
    {
        $post = LearnPost::find($id);

        if (!$post || !$post->isPublic()) {
            return response()->json(['message' => 'Post not found'], 404);
        }

        $validated = $request->validate([
            'reason' => 'required|string|in:'.implode(',', LearnPostReport::REASONS),
            'details' => 'nullable|string|max:500',
        ]);

        $userId = $request->user()->id;
        if (LearnPostReport::where('post_id', $post->id)->where('user_id', $userId)->exists()) {
            return response()->json(['message' => 'You already reported this post.'], 409);
        }

        try {
            LearnPostReport::create([
                'post_id' => $post->id,
                'user_id' => $userId,
                'reason' => $validated['reason'],
                'details' => $validated['details'] ?? null,
            ]);
        } catch (\Illuminate\Database\QueryException $e) {
            if ((string) ($e->errorInfo[0] ?? '') !== '23505') {
                throw $e;
            }

            return response()->json(['message' => 'You already reported this post.'], 409);
        }

        return response()->json(['message' => 'Report received. A reviewer will look at this post.'], 201);
    }

    /**
     * Watch heartbeat from the player. Authenticated viewers only - the
     * unique (post,user) row accumulates watch time, so completion always
     * requires accumulated evidence and each viewer counts once in
     * views_count (no view-count inflation by polling).
     */
    public function heartbeat(Request $request, string $id): JsonResponse
    {
        $post = LearnPost::find($id);

        if (!$post || !$post->isPublic()) {
            return response()->json(['message' => 'Post not found'], 404);
        }

        $validated = $request->validate([
            'watch_seconds' => 'required|integer|min:1|max:60',
        ]);

        $userId = $request->user()->id;

        $row = DB::transaction(function () use ($post, $userId, $validated) {
            $view = LearnVideoView::where('post_id', $post->id)->where('user_id', $userId)->first();

            $isNewViewer = $view === null;
            if ($view === null) {
                $view = LearnVideoView::create([
                    'post_id' => $post->id,
                    'user_id' => $userId,
                    'watch_seconds' => 0,
                ]);
            }

            $total = (int) $view->watch_seconds + (int) $validated['watch_seconds'];
            $threshold = $post->duration_seconds
                ? max(1, (int) round($post->duration_seconds * 0.75))
                : 30;

            $view->update([
                'watch_seconds' => $total,
                'completed' => $view->completed || $total >= $threshold,
            ]);

            if ($isNewViewer) {
                $post->increment('views_count');
            }

            return $view;
        });

        return response()->json(['data' => [
            'watch_seconds' => (int) $row->watch_seconds,
            'completed' => (bool) $row->completed,
            'views_count' => (int) $post->fresh()->views_count,
        ]]);
    }

    /** Share counter + canonical payload (no fake link shortening). */
    public function share(Request $request, string $id): JsonResponse
    {
        $post = LearnPost::find($id);

        if (!$post || !$post->isPublic()) {
            return response()->json(['message' => 'Post not found'], 404);
        }

        $post->increment('shares_count');

        return response()->json(['data' => [
            'shares_count' => (int) $post->fresh()->shares_count,
            'url' => url('/learn/watch/'.$post->id),
            'video_url' => $post->video_provider && $post->video_provider !== 'upload'
                ? VideoResolver::canonicalUrl($post->video_provider, (string) $post->provider_video_id)
                : $post->video_url,
        ]]);
    }

    /** Threaded comments: top-level rows with their replies attached. */
    public function comments(Request $request, string $id): JsonResponse
    {
        $post = LearnPost::find($id);

        if (!$post || !$post->isPublic()) {
            return response()->json(['message' => 'Post not found'], 404);
        }

        $viewerId = $request->user('sanctum')?->id;

        $roots = LearnPostComment::with(['user:id,name', 'replies.user:id,name'])
            ->where('post_id', $post->id)
            ->whereNull('parent_id')
            ->where('status', LearnPostComment::STATUS_VISIBLE)
            ->orderBy('created_at')
            ->paginate(20);

        $items = collect($roots->items())->map(function ($comment) use ($viewerId) {
            $arr = $comment->toArray();
            if ($viewerId) {
                $arr['liked'] = LearnCommentLike::where('comment_id', $comment->id)
                    ->where('user_id', $viewerId)
                    ->exists();
            } else {
                $arr['liked'] = false;
            }

            $arr['replies'] = collect($arr['replies'] ?? [])->map(function ($reply) use ($viewerId) {
                $reply['liked'] = $viewerId
                    ? LearnCommentLike::where('comment_id', $reply['id'])->where('user_id', $viewerId)->exists()
                    : false;

                return $reply;
            })->values();

            return $arr;
        })->values();

        return response()->json(['data' => $items, 'meta' => [
            'current_page' => $roots->currentPage(),
            'last_page' => $roots->lastPage(),
            'total' => $roots->total(),
        ]]);
    }

    public function storeComment(Request $request, string $id): JsonResponse
    {
        $post = LearnPost::find($id);

        if (!$post || !$post->isPublic()) {
            return response()->json(['message' => 'Post not found'], 404);
        }

        $validated = $request->validate([
            'content' => 'required|string|max:2000',
            'parent_id' => 'nullable|uuid',
        ]);

        $parent = null;
        if (!empty($validated['parent_id'])) {
            $parent = LearnPostComment::find($validated['parent_id']);
            if (!$parent || $parent->post_id !== $post->id) {
                return response()->json(['message' => 'Parent comment not found'], 404);
            }
            // One reply level: replies attach to the root comment.
            if ($parent->parent_id !== null) {
                $parent = LearnPostComment::find($parent->parent_id);
            }
        }

        $comment = DB::transaction(function () use ($request, $post, $validated, $parent) {
            $row = LearnPostComment::create([
                'post_id' => $post->id,
                'user_id' => $request->user()->id,
                'parent_id' => $parent?->id,
                'content' => strip_tags($validated['content']),
            ]);
            $post->increment('comments_count');

            return $row;
        });

        return response()->json(['message' => 'Comment added.', 'data' => $comment->load('user:id,name')], 201);
    }

    public function toggleCommentLike(Request $request, string $commentId): JsonResponse
    {
        $comment = LearnPostComment::find($commentId);

        if (!$comment || $comment->status !== LearnPostComment::STATUS_VISIBLE) {
            return response()->json(['message' => 'Comment not found'], 404);
        }

        $liked = false;
        $existing = LearnCommentLike::where('comment_id', $comment->id)
            ->where('user_id', $request->user()->id)
            ->first();

        if ($existing) {
            $existing->delete();
            $comment->decrement('likes_count');
        } else {
            try {
                LearnCommentLike::create(['comment_id' => $comment->id, 'user_id' => $request->user()->id]);
            } catch (\Illuminate\Database\QueryException $e) {
                if ((string) ($e->errorInfo[0] ?? '') !== '23505') {
                    throw $e;
                }
            }
            $comment->increment('likes_count');
            $liked = true;
        }

        return response()->json(['data' => [
            'liked' => $liked,
            'likes_count' => (int) $comment->fresh()->likes_count,
        ]]);
    }

    /** Appeal a rejection: back into the queue with the author's reason. */
    public function appeal(Request $request, string $id): JsonResponse
    {
        $post = LearnPost::find($id);

        if (!$post) {
            return response()->json(['message' => 'Post not found'], 404);
        }
        if ($post->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        if ($post->status !== LearnPost::STATUS_REJECTED) {
            return response()->json(['message' => 'Only rejected posts can be appealed.'], 409);
        }

        $validated = $request->validate([
            'reason' => 'required|string|max:1000',
        ]);

        $post->update([
            'status' => LearnPost::STATUS_PENDING,
            'appeal_reason' => strip_tags($validated['reason']),
            'submitted_at' => now(),
            'assigned_to' => null,
            'reviewed_by' => null,
            'reviewed_at' => null,
        ]);

        return response()->json([
            'message' => 'Appeal submitted. A reviewer will take another look.',
            'data' => $post->fresh(),
        ]);
    }

    /** Follow / unfollow a creator (public social graph edge). */
    public function toggleFollow(Request $request, string $userId): JsonResponse
    {
        if ($userId === $request->user()->id) {
            return response()->json(['message' => 'You cannot follow yourself.'], 422);
        }

        $creator = \App\Models\User::find($userId);
        if (!$creator) {
            return response()->json(['message' => 'Creator not found'], 404);
        }

        $existing = LearnFollow::where('follower_id', $request->user()->id)
            ->where('creator_id', $userId)
            ->first();

        if ($existing) {
            $existing->delete();
            $following = false;
        } else {
            try {
                LearnFollow::create(['follower_id' => $request->user()->id, 'creator_id' => $userId]);
            } catch (\Illuminate\Database\QueryException $e) {
                if ((string) ($e->errorInfo[0] ?? '') !== '23505') {
                    throw $e;
                }
            }
            $following = true;
        }

        return response()->json(['data' => [
            'following' => $following,
            'followers_count' => LearnFollow::where('creator_id', $userId)->count(),
        ]]);
    }

    /** Public creator page data (approved posts only). */
    public function creator(Request $request, string $userId): JsonResponse
    {
        $creator = \App\Models\User::find($userId);
        if (!$creator) {
            return response()->json(['message' => 'Creator not found'], 404);
        }

        $viewerId = $request->user('sanctum')?->id;

        $posts = LearnPost::with('user:id,name')
            ->where('user_id', $userId)
            ->where('status', LearnPost::STATUS_APPROVED)
            ->orderByDesc('created_at')
            ->paginate(12);

        return response()->json([
            'data' => [
                'id' => $creator->id,
                'name' => $creator->name,
                'avatar' => null,
                'posts_count' => LearnPost::where('user_id', $userId)->where('status', LearnPost::STATUS_APPROVED)->count(),
                'followers_count' => LearnFollow::where('creator_id', $userId)->count(),
                'following' => $viewerId
                    ? LearnFollow::where('follower_id', $viewerId)->where('creator_id', $userId)->exists()
                    : false,
            ],
            'posts' => $posts->items(),
            'meta' => [
                'current_page' => $posts->currentPage(),
                'last_page' => $posts->lastPage(),
                'total' => $posts->total(),
            ],
        ]);
    }

    /** Health/finance/legal topics need a senior reviewer (two-tier gate). */
    private function isSensitive(?string $category): bool
    {
        if (!$category) {
            return false;
        }

        return in_array(strtolower(trim($category)), LearnPost::SENSITIVE_CATEGORIES, true);
    }

    private function uniqueSlug(string $title): string
    {
        $base = Str::slug($title);
        $base = $base !== '' ? $base : 'post';
        $slug = Str::limit($base, 180, '');

        if (!LearnPost::where('slug', $slug)->exists()) {
            return $slug;
        }

        return Str::limit($base, 170, '').'-'.Str::lower(Str::random(6));
    }
}
