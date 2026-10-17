<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\KycReviewRequest;
use App\Http\Requests\KycSubmitRequest;
use Core\Exceptions\ValidationException;
use Core\Support\KycStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Core\Services\Contracts\AuditServiceInterface;
use Core\Support\PiiCipher;

class KycController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $row = DB::table('kyc_verifications')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->first();

        if (!$row) {
            return response()->json(['data' => [
                'user_id' => $request->user()->id,
                'status' => 'pending',
                'verification_state' => KycStatus::NOT_STARTED,
            ]]);
        }

        // Spec 28: never expose raw document numbers, document files or the
        // reviewer identity to the subject — a masked summary is enough.
        // PII columns are AES-256-GCM at rest: decrypt-then-mask on the way
        // out (legacy plaintext rows read through unchanged).
        return response()->json(['data' => [
            'id' => $row->id,
            'user_id' => $row->user_id,
            'status' => $row->status,
            'verification_state' => KycStatus::canonical($row->status),
            'document_type' => $row->document_type,
            'document_number_masked' => self::maskDocumentNumber(PiiCipher::decrypt($row->document_number)),
            'full_name' => $row->full_name ? PiiCipher::decrypt($row->full_name) : null,
            'nationality' => $row->nationality ? PiiCipher::decrypt($row->nationality) : null,
            'rejection_reason' => $row->rejection_reason,
            'attempts' => (int) ($row->attempts ?? 0),
            'submitted_at' => $row->submitted_at,
            'reviewed_at' => $row->reviewed_at,
            'verified_at' => $row->verified_at ?? null,
        ]]);
    }

    public function submit(KycSubmitRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $userId = $request->user()->id;
        $existing = DB::table('kyc_verifications')
            ->where('user_id', $userId)
            ->whereIn('status', ['pending', 'submitted'])
            ->lockForUpdate()
            ->first();

        if ($existing) {
            return response()->json(['message' => 'A KYC submission is already under review'], 409);
        }

        $id = (string) \Illuminate\Support\Str::uuid();
        $attempts = (int) DB::table('kyc_verifications')
            ->where('user_id', $userId)
            ->max('attempts') + 1;

        // Backlog #2: documents move from the public upload landing zone to
        // the private `local` disk at submit time — everything after this
        // point is reachable only through signed URLs / gated streams.
        $frontPath = $this->documentPath($validated['document_front_path'] ?? null, $userId);
        $backPath = $this->documentPath($validated['document_back_path'] ?? null, $userId);
        $frontPath = $this->moveToPrivate($frontPath, $userId);
        $backPath = $this->moveToPrivate($backPath, $userId);
        $moved = fn (?string $p): bool => $p !== null && str_starts_with($p, 'kyc/u/');

        DB::table('kyc_verifications')->insert([
            'id' => $id,
            'user_id' => $userId,
            'status' => 'submitted',
            'document_type' => $validated['document_type'],
            'document_number' => PiiCipher::encrypt($validated['document_number']),
            'document_front_path' => $frontPath,
            'document_back_path' => $backPath,
            'disk' => ($moved($frontPath) || $moved($backPath)) ? 'local' : 'public',
            'full_name' => PiiCipher::encrypt($validated['full_name'] ?? null),
            'date_of_birth' => PiiCipher::encrypt($validated['date_of_birth'] ?? null),
            'nationality' => PiiCipher::encrypt($validated['nationality'] ?? null),
            'address' => PiiCipher::encrypt($validated['address'] ?? null),
            'id_expiry_date' => $validated['id_expiry_date'] ?? null,
            'attempts' => $attempts,
            'submitted_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        try {
            app(AuditServiceInterface::class)->log([
                'action' => 'kyc.submitted',
                'entity_type' => 'kyc_verification',
                'entity_id' => $id,
                'performed_by' => $userId,
                'new_values' => ['status' => 'submitted'],
            ]);
        } catch (\Throwable) {
        }

        return response()->json([
            'message' => 'KYC submitted for review',
            'data' => ['id' => $id, 'status' => 'submitted', 'verification_state' => KycStatus::UNDER_REVIEW],
        ], 201);
    }

    /**
     * Documents only count when they came through the KYC uploader
     * (POST /api/upload, folder kyc-documents): arbitrary client paths and
     * path traversal are rejected.
     */
    private function documentPath(?string $value, string $userId): ?string
    {
        if ($value === null || trim($value) === '') {
            return null;
        }

        $path = trim($value);
        foreach ([config('app.url').'/storage/', '/storage/'] as $prefix) {
            if ($prefix !== '' && $prefix !== '/' && str_starts_with($path, $prefix)) {
                $path = substr($path, strlen($prefix));
                break;
            }
        }
        $path = ltrim($path, '/');

        $scope = 'uploads/u/'.$userId.'/kyc-documents/';
        if (!str_starts_with($path, $scope) || str_contains($path, '..')) {
            throw new ValidationException('Documents must be uploaded through the KYC document uploader.');
        }

        return $path;
    }

    /**
     * Move an uploaded document from the public landing zone onto the
     * private disk (backlog #2). Returns the path on the private disk,
     * or null when there is nothing to move. Falls back to the public
     * path unchanged when the private move fails, so a submission never
     * loses its documents to a storage hiccup.
     */
    private function moveToPrivate(?string $path, string $userId): ?string
    {
        if ($path === null) {
            return null;
        }

        if (! Storage::disk('public')->exists($path)) {
            return $path;
        }

        try {
            $contents = Storage::disk('public')->get($path);
            $privateScope = 'kyc/u/'.$userId;
            $privatePath = $privateScope.'/'.basename($path);
            Storage::disk('local')->put($privatePath, $contents);
            Storage::disk('public')->delete($path);

            return $privatePath;
        } catch (\Throwable) {
            return $path;
        }
    }

    private static function maskDocumentNumber(?string $number): ?string
    {
        if ($number === null || $number === '') {
            return null;
        }

        return strlen($number) > 4 ? '****'.substr($number, -4) : '****';
    }

    public function review(KycReviewRequest $request, string $id): JsonResponse
    {
        $row = DB::table('kyc_verifications')->where('id', $id)->lockForUpdate()->first();
        if (!$row) {
            return response()->json(['message' => 'KYC not found'], 404);
        }

        // Re-reviews loop through requires_action; decided rows are one-shot.
        if (!KycStatus::isReviewable($row->status)) {
            return response()->json(['message' => "Cannot review status '{$row->status}'"], 422);
        }

        DB::table('kyc_verifications')->where('id', $id)->update([
            'status' => $request->status,
            'rejection_reason' => $request->status === 'approved' ? null : $request->rejection_reason,
            'verified_at' => $request->status === 'approved' ? now() : null,
            'reviewed_at' => now(),
            'reviewed_by' => $request->user()->id,
            'updated_at' => now(),
        ]);

        try {
            app(AuditServiceInterface::class)->log([
                'action' => 'kyc.'.$request->status,
                'entity_type' => 'kyc_verification',
                'entity_id' => $id,
                'performed_by' => $request->user()->id,
                'old_values' => ['status' => $row->status],
                'new_values' => ['status' => $request->status],
            ]);
        } catch (\Throwable) {
        }

        // Spec 50: the subject learns the decision even without polling.
        try {
            $titles = [
                'approved' => 'Identity verified',
                'rejected' => 'Verification rejected',
                'requires_action' => 'Verification needs your attention',
            ];
            app(\Core\Services\Contracts\NotificationServiceInterface::class)->notify(
                (string) $row->user_id,
                $titles[$request->status] ?? 'Verification update',
                $request->status === 'approved'
                    ? 'Your identity verification was approved.'
                    : ($request->rejection_reason ?: 'Your verification needs attention.'),
                'kyc',
                $id
            );
        } catch (\Throwable) {
        }

        return response()->json([
            'message' => 'KYC '.$request->status,
            'data' => ['id' => $id, 'status' => $request->status],
        ]);
    }

    /** Owner streams their own latest documents (no public URLs involved). */
    public function document(Request $request, string $side)
    {
        if (!in_array($side, ['front', 'back'], true)) {
            return response()->json(['message' => 'Unknown document side'], 404);
        }

        $row = DB::table('kyc_verifications')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->first();

        return $this->streamDocument($row?->user_id, $side === 'front' ? $row?->document_front_path : $row?->document_back_path, $row?->disk ?? 'public');
    }

    /** Reviewers stream a submission's documents with the same role gate as review. */
    public function reviewDocument(Request $request, string $id, string $side)
    {
        if (!in_array($side, ['front', 'back'], true)) {
            return response()->json(['message' => 'Unknown document side'], 404);
        }

        $row = DB::table('kyc_verifications')->where('id', $id)->first();
        if (!$row) {
            return response()->json(['message' => 'KYC not found'], 404);
        }

        return $this->streamDocument($row->user_id, $side === 'front' ? $row->document_front_path : $row->document_back_path, $row->disk ?? 'public');
    }

    /**
     * Owner gets a short-lived signed URL for their own latest documents
     * (backlog #2: frontend <img> display without a proxied stream).
     */
    public function documentSignedUrl(Request $request, string $side)
    {
        if (!in_array($side, ['front', 'back'], true)) {
            return response()->json(['message' => 'Unknown document side'], 404);
        }

        $row = DB::table('kyc_verifications')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->first();

        $path = $side === 'front' ? $row?->document_front_path : $row?->document_back_path;
        $url = $this->signedUrlForRow($row?->user_id, $path, $row?->disk ?? 'public', $row?->id, $request->user()->id);

        if ($url === null) {
            return response()->json(['message' => 'Document not found'], 404);
        }

        return response()->json(['data' => ['url' => $url, 'expires_in' => 900]]);
    }

    /** Reviewers mint signed URLs with the same role gate as streaming. */
    public function reviewDocumentSignedUrl(Request $request, string $id, string $side)
    {
        if (!in_array($side, ['front', 'back'], true)) {
            return response()->json(['message' => 'Unknown document side'], 404);
        }

        $row = DB::table('kyc_verifications')->where('id', $id)->first();
        if (!$row) {
            return response()->json(['message' => 'KYC not found'], 404);
        }

        $path = $side === 'front' ? $row->document_front_path : $row->document_back_path;
        $url = $this->signedUrlForRow($row->user_id, $path, $row->disk ?? 'public', $row->id, $request->user()->id);

        if ($url === null) {
            return response()->json(['message' => 'Document not found'], 404);
        }

        return response()->json(['data' => ['url' => $url, 'expires_in' => 900]]);
    }

    private function signedUrlForRow(?string $ownerId, ?string $path, string $disk, ?string $kycId, string $requesterId): ?string
    {
        if ($ownerId === null || $path === null || $path === '') {
            return null;
        }

        if (! $this->pathInScope($ownerId, $path, $disk)) {
            return null;
        }

        if (! Storage::disk($disk)->exists($path)) {
            return null;
        }

        return app(\Core\Services\Contracts\SignedStorageServiceInterface::class)
            ->generateSignedUrl($path, $disk, 15, [
                'entity_type' => 'kyc_verification',
                'entity_id' => $kycId,
                'performed_by' => $requesterId,
            ]);
    }

    /** Defence in depth: only files inside the owner's document scope. */
    private function pathInScope(string $ownerId, string $path, string $disk): bool
    {
        if (str_contains($path, '..')) {
            return false;
        }

        if ($disk === 'local') {
            return str_starts_with($path, 'kyc/u/'.$ownerId.'/');
        }

        return str_starts_with($path, 'uploads/u/'.$ownerId.'/kyc-documents/');
    }

    private function streamDocument(?string $ownerId, ?string $path, string $disk = 'public')
    {
        if ($ownerId === null || $path === null || $path === '') {
            return response()->json(['message' => 'Document not found'], 404);
        }

        // Defence in depth: only files inside the owner's document scope.
        if (! $this->pathInScope($ownerId, $path, $disk) || !in_array($disk, ['local', 'public'], true) || !Storage::disk($disk)->exists($path)) {
            return response()->json(['message' => 'Document not found'], 404);
        }

        return Storage::disk($disk)->response($path, null, [
            'Cache-Control' => 'no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
