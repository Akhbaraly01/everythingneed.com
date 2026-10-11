<?php

namespace Modules\Learn\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Modules\Learn\Entities\LearnPlaylist;
use Modules\Learn\Entities\LearnPlaylistItem;
use Modules\Learn\Entities\LearnPost;

/**
 * Personal playlists (collections) - owner-scoped. Missing/foreign
 * playlists answer 404 (no existence enumeration for other people's
 * collections).
 */
class LearnPlaylistController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $playlists = LearnPlaylist::withCount('items')
            ->where('user_id', $request->user()->id)
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $playlists]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:120',
        ]);

        $userId = $request->user()->id;
        $exists = LearnPlaylist::where('user_id', $userId)->where('name', $validated['name'])->exists();

        if ($exists) {
            return response()->json(['message' => 'You already have a playlist with this name.'], 409);
        }

        $playlist = LearnPlaylist::create([
            'user_id' => $userId,
            'name' => strip_tags($validated['name']),
        ]);

        return response()->json(['message' => 'Playlist created.', 'data' => $playlist], 201);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $playlist = $this->owned($request, $id);

        if (!$playlist) {
            return response()->json(['message' => 'Playlist not found'], 404);
        }

        $items = LearnPlaylistItem::with(['post.user:id,name'])
            ->where('playlist_id', $playlist->id)
            ->orderBy('position')
            ->get()
            ->pluck('post')
            ->filter(fn ($post) => $post && $post->status === LearnPost::STATUS_APPROVED)
            ->values();

        return response()->json(['data' => $playlist, 'posts' => $items]);
    }

    public function storeItem(Request $request, string $id): JsonResponse
    {
        $playlist = $this->owned($request, $id);

        if (!$playlist) {
            return response()->json(['message' => 'Playlist not found'], 404);
        }

        $validated = $request->validate(['post_id' => 'required|uuid']);

        $post = LearnPost::find($validated['post_id']);
        if (!$post || $post->status !== LearnPost::STATUS_APPROVED) {
            return response()->json(['message' => 'Post not found'], 404);
        }

        if (LearnPlaylistItem::where('playlist_id', $playlist->id)->where('post_id', $post->id)->exists()) {
            return response()->json(['message' => 'Already in this playlist.'], 409);
        }

        $position = (int) LearnPlaylistItem::where('playlist_id', $playlist->id)->max('position') + 1;

        $item = LearnPlaylistItem::create([
            'playlist_id' => $playlist->id,
            'post_id' => $post->id,
            'position' => $position,
        ]);

        return response()->json(['message' => 'Added to playlist.', 'data' => $item], 201);
    }

    public function destroyItem(Request $request, string $id, string $postId): JsonResponse
    {
        $playlist = $this->owned($request, $id);

        if (!$playlist || !Str::isUuid($postId)) {
            return response()->json(['message' => 'Playlist not found'], 404);
        }

        // Hard delete: the (playlist_id, post_id) unique index has no
        // deleted_at column, so a soft-deleted item would block re-adding.
        $deleted = LearnPlaylistItem::where('playlist_id', $playlist->id)
            ->where('post_id', $postId)
            ->forceDelete();

        if ($deleted === 0) {
            return response()->json(['message' => 'Item not found'], 404);
        }

        return response()->json(['message' => 'Removed from playlist.']);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $playlist = $this->owned($request, $id);

        if (!$playlist) {
            return response()->json(['message' => 'Playlist not found'], 404);
        }

        // Hard delete: a soft-deleted name would keep blocking the
        // unique (user_id, name) constraint on re-creation.
        $playlist->forceDelete();

        return response()->json(['message' => 'Playlist deleted.']);
    }

    private function owned(Request $request, string $id): ?LearnPlaylist
    {
        return LearnPlaylist::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();
    }
}
