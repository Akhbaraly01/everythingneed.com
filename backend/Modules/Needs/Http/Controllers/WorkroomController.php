<?php

namespace Modules\Needs\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Modules\Needs\Entities\NeedFile;
use Modules\Needs\Entities\NeedRequest;

/**
 * N-24 workroom: shared files per engaged request.
 *
 * Parties = the request owner, the accepted provider, and moderators —
 * everyone else gets 403 before touching the disk. Bytes live on the
 * PRIVATE `local` disk under workrooms/{request}/{uuid}; downloads only
 * ever happen through short-lived signed URLs minted on demand (never
 * stored, never public).
 */
class WorkroomController extends Controller
{
    private const DISK = 'local';

    private const MAX_MB = 10;

    private const MIMES = [
        'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
        'pdf', 'txt', 'csv', 'md', 'zip',
        'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
    ];

    /**
     * GET /api/need-requests/{id}/files — metadata only; URLs are minted
     * per download so a list can never leak a link that outlives access.
     */
    public function index(Request $request, string $id): JsonResponse
    {
        $needRequest = NeedRequest::find($id);
        if (! $needRequest) {
            return response()->json(['message' => 'Request not found'], 404);
        }
        if (! $this->isParty($request, $needRequest)) {
            return response()->json(['message' => 'Only the request parties can access this workroom'], 403);
        }

        $uploaderIds = [];
        $files = NeedFile::where('need_request_id', $needRequest->id)
            ->orderByDesc('created_at')
            ->get();
        foreach ($files as $file) {
            $uploaderIds[] = $file->uploader_id;
        }
        $uploaders = \App\Models\User::whereIn('id', array_unique($uploaderIds))
            ->get(['id', 'name'])
            ->keyBy(fn ($u) => (string) $u->id);

        return response()->json(['data' => $files->map(fn (NeedFile $file) => [
            'id' => $file->id,
            'original_name' => $file->original_name,
            'size' => $file->size,
            'mime' => $file->mime,
            'created_at' => $file->created_at,
            'uploaded_by' => [
                'id' => $file->uploader_id,
                'name' => $uploaders[(string) $file->uploader_id]->name ?? null,
            ],
            'can_delete' => $this->canDelete($request, $needRequest, $file),
        ])->values()]);
    }

    /**
     * POST /api/need-requests/{id}/files — multipart upload to the
     * private disk. Size and type are refused BEFORE anything is written.
     */
    public function store(Request $request, string $id): JsonResponse
    {
        $needRequest = NeedRequest::find($id);
        if (! $needRequest) {
            return response()->json(['message' => 'Request not found'], 404);
        }
        if (! $this->isParty($request, $needRequest)) {
            return response()->json(['message' => 'Only the request parties can access this workroom'], 403);
        }

        $validated = $request->validate([
            'file' => ['required', 'file', 'max:'.(self::MAX_MB * 1024), 'mimes:'.implode(',', self::MIMES)],
        ]);

        $upload = $request->file('file');
        $extension = strtolower($upload->getClientOriginalExtension() ?: $upload->extension() ?: 'bin');
        $path = $upload->storeAs(
            'workrooms/'.$needRequest->id,
            Str::uuid().'.'.$extension,
            self::DISK,
        );

        if ($path === false) {
            return response()->json(['message' => 'Could not store the file'], 500);
        }

        $file = NeedFile::create([
            'need_request_id' => $needRequest->id,
            'uploader_id' => $request->user()->id,
            'original_name' => $upload->getClientOriginalName(),
            'disk' => self::DISK,
            'path' => $path,
            'size' => $upload->getSize(),
            'mime' => $upload->getClientMimeType(),
        ]);

        return response()->json([
            'message' => 'File uploaded',
            'data' => [
                'id' => $file->id,
                'original_name' => $file->original_name,
                'size' => $file->size,
                'mime' => $file->mime,
                'created_at' => $file->created_at,
                'uploaded_by' => ['id' => $file->uploader_id, 'name' => $request->user()->name],
                'can_delete' => true,
            ],
        ], 201);
    }

    /**
     * GET /api/need-requests/{id}/files/{fileId}/url — fresh 15-minute
     * signed URL for one file; the path never appears without a signature.
     */
    public function signedUrl(Request $request, string $id, string $fileId): JsonResponse
    {
        $needRequest = NeedRequest::find($id);
        if (! $needRequest) {
            return response()->json(['message' => 'Request not found'], 404);
        }
        if (! $this->isParty($request, $needRequest)) {
            return response()->json(['message' => 'Only the request parties can access this workroom'], 403);
        }

        $file = NeedFile::where('need_request_id', $needRequest->id)->find($fileId);
        if (! $file) {
            return response()->json(['message' => 'File not found'], 404);
        }
        if (! Storage::disk($file->disk)->exists($file->path)) {
            return response()->json(['message' => 'File no longer exists'], 404);
        }

        $url = app(\Core\Services\Contracts\SignedStorageServiceInterface::class)
            ->generateSignedUrl($file->path, $file->disk, 15, [
                'entity_type' => 'need_file',
                'entity_id' => $file->id,
                'performed_by' => $request->user()->id,
            ]);

        return response()->json(['data' => ['url' => $url, 'expires_in' => 900]]);
    }

    /**
     * DELETE /api/need-requests/{id}/files/{fileId} — uploader, owner,
     * or moderator; soft-deletes the row and the bytes together.
     */
    public function destroy(Request $request, string $id, string $fileId): JsonResponse
    {
        $needRequest = NeedRequest::find($id);
        if (! $needRequest) {
            return response()->json(['message' => 'Request not found'], 404);
        }
        if (! $this->isParty($request, $needRequest)) {
            return response()->json(['message' => 'Only the request parties can access this workroom'], 403);
        }

        $file = NeedFile::where('need_request_id', $needRequest->id)->find($fileId);
        if (! $file) {
            return response()->json(['message' => 'File not found'], 404);
        }
        if (! $this->canDelete($request, $needRequest, $file)) {
            return response()->json(['message' => 'Only the uploader or the request owner can remove this file'], 403);
        }

        Storage::disk($file->disk)->delete($file->path);
        $file->delete();

        return response()->json(['message' => 'File removed']);
    }

    private function isParty(Request $request, NeedRequest $needRequest): bool
    {
        $user = $request->user();

        if ($this->isModerator($user)) {
            return true;
        }
        if ((string) $needRequest->user_id === (string) $user->id) {
            return true;
        }

        $accepted = $needRequest->acceptedOffer;

        return $accepted !== null && (string) $accepted->provider_id === (string) $user->id;
    }

    private function canDelete(Request $request, NeedRequest $needRequest, NeedFile $file): bool
    {
        $user = $request->user();

        return (string) $file->uploader_id === (string) $user->id
            || (string) $needRequest->user_id === (string) $user->id
            || $this->isModerator($user);
    }

    private function isModerator(object $user): bool
    {
        return $user->hasRole('super_admin')
            || $user->hasRole('administrator')
            || $user->hasRole('needs_admin')
            || $user->hasRole('platform_ops');
    }
}
