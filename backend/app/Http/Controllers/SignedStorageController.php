<?php

namespace App\Http\Controllers;

use Core\Services\Contracts\SignedStorageServiceInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SignedStorageController extends Controller
{
    /**
     * Stream a private file through a signed URL (backlog #2: signed-URL
     * private attachments). The `signed` middleware validates the HMAC
     * signature + expiry before we touch the disk; the disk parameter is
     * re-checked so a `local`-scoped signature can never read `public`.
     */
    public function stream(Request $request, SignedStorageServiceInterface $signed)
    {
        $path = $request->query('path');
        $disk = $request->query('disk', 'local');

        if (! is_string($path) || $path === '' || str_contains($path, '..')) {
            abort(404);
        }

        if (! in_array($disk, ['local', 'public'], true)) {
            abort(404);
        }

        if (! Storage::disk($disk)->exists($path)) {
            abort(404);
        }

        $filename = basename($path);

        $response = $signed->streamPrivateFile($path, $disk, $filename);

        $signed->auditAccess('stream', $path, $disk, $request->user()?->id, [
            'ip' => $request->ip(),
        ]);

        return $response;
    }
}