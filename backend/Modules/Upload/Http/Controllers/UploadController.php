<?php

namespace Modules\Upload\Http\Controllers;

use App\Http\Controllers\Controller;
use Core\Services\Contracts\MediaServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Modules\Admin\Entities\MediaItem;
use Modules\Upload\Http\Requests\DeleteUploadRequest;
use Modules\Upload\Http\Requests\UploadFileRequest;

class UploadController extends Controller
{
    /**
     * Every upload is namespaced under the uploader's personal scope:
     * uploads/u/{user_id}/{optional-subfolder}/filename
     *
     * W1: images flow through the GD pipeline (capped at 2048px, quality
     * 85) so huge camera uploads never land raw on the public disk. The
     * response shape is unchanged.
     */
    public function store(UploadFileRequest $request, MediaServiceInterface $media): JsonResponse
    {
        $file = $request->file('file');
        $subfolder = Str::slug($request->get('folder', 'files')) ?: 'files';
        $scope = 'uploads/u/'.$request->user()->id."/$subfolder";

        $result = $media->upload($scope, $file, [
            'disk' => 'public',
            'max_width' => 2048,
            'max_height' => 2048,
            'quality' => 85,
        ]);
        $path = $result['path'];

        // Record the upload in the media library (spec S44): every stored
        // file gets an auditable row with real MIME/size/dimensions - the
        // finfo-derived MIME of the stored bytes is used, never the
        // browser-supplied one (mimes rule validated it first).
        $mime = $result['mime_type'];
        $dimensions = null;
        if (str_starts_with($mime, 'image/')) {
            $dimensions = @getimagesize(Storage::disk('public')->path($path)) ?: null;
        }

        MediaItem::create([
            'title' => Str::limit(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME), 250, ''),
            'file_name' => Str::limit($file->getClientOriginalName(), 255, ''),
            'disk' => 'public',
            'path' => $path,
            'mime_type' => $mime,
            'size' => (int) $result['size'],
            'width' => $dimensions[0] ?? null,
            'height' => $dimensions[1] ?? null,
            'owner_type' => 'user',
            'owner_id' => $request->user()->id,
            'meta' => ['folder' => $subfolder],
        ]);

        return response()->json([
            'data' => [
                'url' => $result['url'],
                'path' => $path,
                'name' => $file->getClientOriginalName(),
                'size' => $result['size'],
                'mime_type' => $mime,
            ],
        ], 201);
    }

    /**
     * Users may delete ONLY files inside their own scope. Admins may
     * moderate any upload. Traversal tricks are rejected outright.
     */
    public function destroy(DeleteUploadRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $path = ltrim($validated['path'], '/');

        $isAdmin = $request->user()->hasRole('super_admin')
            || $request->user()->hasRole('administrator');
        $ownScope = 'uploads/u/'.$request->user()->id.'/';

        if (!$isAdmin && !str_starts_with($path, $ownScope)) {
            return response()->json([
                'message' => 'You may only delete your own uploads.',
            ], 403);
        }

        // Defence in depth: resolved path must stay inside the disk root
        $diskRoot = realpath(Storage::disk('public')->path('/'));
        $target = realpath(Storage::disk('public')->path($path));

        if ($diskRoot === false || $target === false || !str_starts_with($target, $diskRoot)) {
            return response()->json(['message' => 'Invalid path.'], 422);
        }

        if (!Storage::disk('public')->exists($path)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        Storage::disk('public')->delete($path);

        return response()->json(['message' => 'File deleted']);
    }
}
