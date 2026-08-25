<?php

namespace Modules\Upload\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    /**
     * Every upload is namespaced under the uploader's personal scope:
     * uploads/u/{user_id}/{optional-subfolder}/filename
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|max:10240|mimes:jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx,mp4,webm',
            'folder' => ['nullable', 'string', 'max:100', 'regex:/^[A-Za-z0-9_-]+$/'],
        ]);

        $file = $request->file('file');
        $subfolder = Str::slug($request->get('folder', 'files')) ?: 'files';
        $scope = 'uploads/u/'.$request->user()->id."/$subfolder";

        $path = $file->store($scope, 'public');

        return response()->json([
            'data' => [
                'url' => Storage::disk('public')->url($path),
                'path' => $path,
                'name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
            ],
        ], 201);
    }

    /**
     * Users may delete ONLY files inside their own scope. Admins may
     * moderate any upload. Traversal tricks are rejected outright.
     */
    public function destroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'path' => [
                'required',
                'string',
                'max:500',
                // No absolute paths, no traversal, no backslashes
                'not_regex:(^/|\.\.|\\\\)',
            ],
        ]);

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
