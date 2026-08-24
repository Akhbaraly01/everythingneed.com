<?php

namespace Modules\Upload\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UploadController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|max:10240|mimes:jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx,mp4,webm',
            'folder' => 'nullable|string|max:100',
        ]);

        $file = $request->file('file');
        $folder = $request->get('folder', 'uploads');
        $path = $file->store($folder, 'public');

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

    public function destroy(Request $request): JsonResponse
    {
        $request->validate([
            'path' => 'required|string',
        ]);

        $path = $request->path;

        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
            return response()->json(['message' => 'File deleted']);
        }

        return response()->json(['message' => 'File not found'], 404);
    }
}
