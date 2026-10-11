<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Core\Services\Contracts\MediaServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Modules\Admin\Entities\MediaItem;
use Modules\Admin\Http\Requests\AdminMediaUploadRequest;

/**
 * Media library API (spec S44/S86).
 *
 * Reads list every recorded upload (media.view); deletes require
 * media.manage AND ownership unless the caller is a platform admin.
 * Files live on the public disk under uploads/u/{user_id}/... and the
 * stored path is realpath-checked before any delete.
 */
class AdminMediaController extends Controller
{
    /** GET /api/admin/media */
    public function index(Request $request): JsonResponse
    {
        $query = MediaItem::query()->orderByDesc('created_at');

        // Non-admin library users only see their own uploads.
        $isLibraryAdmin = $request->user()->hasRole('super_admin')
            || $request->user()->hasRole('administrator')
            || $request->user()->hasRole('content_manager');
        if (! $isLibraryAdmin) {
            $query->where('owner_type', 'user')->where('owner_id', $request->user()->id);
        }

        // W1: substring search for the library page + picker.
        $search = trim((string) $request->get('search', ''));
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'ilike', "%{$search}%")
                    ->orWhere('file_name', 'ilike', "%{$search}%")
                    ->orWhere('path', 'ilike', "%{$search}%");
            });
        }

        $items = $query->paginate(50);

        return response()->json(['data' => $items]);
    }

    /** POST /api/admin/media - permission:media.manage + manageCms gate.
     *
     * Shared-library upload for banners/CMS/product imagery. Unlike the
     * personal /api/upload endpoint (own user scope), library files live
     * under library/{folder} and are visible to every library admin. Large
     * images are capped through the GD pipeline (1920x1080).
     */
    public function store(AdminMediaUploadRequest $request, MediaServiceInterface $media): JsonResponse
    {
        $file = $request->file('file');
        $folder = $request->get('folder', 'library');
        $scope = 'library/'.$folder;

        $result = $media->upload($scope, $file, [
            'disk' => 'public',
            'max_width' => 1920,
            'max_height' => 1080,
            'quality' => 85,
        ]);
        $path = $result['path'];
        $mime = $result['mime_type'];

        $dimensions = null;
        if (str_starts_with($mime, 'image/')) {
            $dimensions = @getimagesize(Storage::disk('public')->path($path)) ?: null;
        }

        $item = MediaItem::create([
            'title' => Str::limit(
                $request->get('title') ?: pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
                250,
                ''
            ),
            'file_name' => Str::limit($file->getClientOriginalName(), 255, ''),
            'disk' => 'public',
            'path' => $path,
            'mime_type' => $mime,
            'size' => (int) $result['size'],
            'width' => $dimensions[0] ?? null,
            'height' => $dimensions[1] ?? null,
            'owner_type' => 'user',
            'owner_id' => $request->user()->id,
            'meta' => ['folder' => $folder, 'scope' => 'library'],
        ]);

        return response()->json([
            'data' => [
                'id' => $item->id,
                'url' => $result['url'],
                'path' => $path,
                'name' => $file->getClientOriginalName(),
                'size' => $result['size'],
                'mime_type' => $mime,
                'width' => $item->width,
                'height' => $item->height,
            ],
        ], 201);
    }

    /** DELETE /api/admin/media/{id} */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $item = MediaItem::find($id);
        abort_unless($item !== null, 404, 'Media not found');

        $isPlatformAdmin = $request->user()->hasRole('super_admin')
            || $request->user()->hasRole('administrator');
        $isOwner = $item->owner_type === 'user' && $item->owner_id === $request->user()->id;

        if (! $isPlatformAdmin && ! $isOwner) {
            return response()->json(['message' => 'You may only delete your own media.'], 403);
        }

        $disk = Storage::disk($item->disk ?: 'public');
        $path = ltrim($item->path, '/');

        // Defence in depth: resolved path must stay inside the disk root.
        $diskRoot = realpath($disk->path('/'));
        $target = realpath($disk->path($path));
        if ($diskRoot !== false && $target !== false && str_starts_with($target, $diskRoot) && $disk->exists($path)) {
            $disk->delete($path);
        }

        $item->delete();

        return response()->json(['message' => 'Media deleted']);
    }
}
