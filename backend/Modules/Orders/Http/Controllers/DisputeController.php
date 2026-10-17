<?php

namespace Modules\Orders\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Orders\Entities\Dispute;
use Modules\Orders\Entities\DisputeEvidence;

class DisputeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $disputes = Dispute::where('user_id', $request->user()->id)
            ->with('order')
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $disputes->items(),
            'meta' => [
                'current_page' => $disputes->currentPage(),
                'last_page' => $disputes->lastPage(),
                'total' => $disputes->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'order_id' => 'nullable|uuid|exists:orders,id',
            'need_request_id' => 'nullable|uuid|exists:need_requests,id',
            'task_id' => 'nullable|uuid|exists:task_posts,id',
            'subject' => 'required|string|max:255',
            'description' => 'required|string|max:5000',
        ]);

        // Exactly one context per dispute: order (existing) or needs-scope.
        $contexts = array_filter([
            $request->order_id,
            $request->need_request_id,
            $request->task_id,
        ]);
        if (count($contexts) > 1) {
            return response()->json(['message' => 'A dispute covers one order, request, or task'], 422);
        }

        $order = null;

        if ($request->order_id) {
            $order = \Modules\Orders\Entities\Order::find($request->order_id);

            if (! $order || $order->user_id !== $request->user()->id) {
                return response()->json(['message' => 'Not your order'], 403);
            }

            if (in_array($order->status, [\Modules\Orders\Entities\Order::STATUS_CANCELLED, \Modules\Orders\Entities\Order::STATUS_REFUNDED], true)) {
                return response()->json(['message' => "This order can no longer be disputed - it is '{$order->status}'"], 422);
            }
        }

        // P0 needs console: requester or assigned provider may dispute a
        // needs request; task owner or assigned worker may dispute a task.
        if ($request->need_request_id) {
            $needRequest = \Modules\Needs\Entities\NeedRequest::find($request->need_request_id);
            $isOwner = $needRequest && (string) $needRequest->user_id === (string) $request->user()->id;
            $isProvider = $needRequest && $needRequest->acceptedOffer
                && (string) $needRequest->acceptedOffer->provider_id === (string) $request->user()->id;

            if (! $needRequest || (! $isOwner && ! $isProvider)) {
                return response()->json(['message' => 'Not your request'], 403);
            }

            if (! in_array($needRequest->status, [
                \Modules\Needs\Entities\NeedRequest::STATUS_PAID,
                \Modules\Needs\Entities\NeedRequest::STATUS_IN_PROGRESS,
                \Modules\Needs\Entities\NeedRequest::STATUS_FULFILLED,
            ], true)) {
                return response()->json(['message' => "Disputes can only be raised while work is underway ('{$needRequest->status}')"], 422);
            }
        }

        if ($request->task_id) {
            $task = \Modules\Needs\Entities\TaskPost::find($request->task_id);
            $isOwner = $task && (string) $task->created_by === (string) $request->user()->id;
            $isWorker = $task && $task->assigned_application_id
                && (string) ($task->assignedApplication?->user_id) === (string) $request->user()->id;

            if (! $task || (! $isOwner && ! $isWorker)) {
                return response()->json(['message' => 'Not your task'], 403);
            }
        }

        $dispute = Dispute::create([
            'user_id' => $request->user()->id,
            'order_id' => $request->order_id,
            'need_request_id' => $request->need_request_id,
            'task_id' => $request->task_id,
            'subject' => $request->subject,
            'description' => $request->description,
            'status' => 'open',
            'previous_status' => $order?->status,
        ]);

        // §32: the order shows as disputed while the case is open; closing or
        // resolving it restores the status it interrupted.
        if ($order && $order->status !== \Modules\Orders\Entities\Order::STATUS_DISPUTED) {
            $order->update(['status' => \Modules\Orders\Entities\Order::STATUS_DISPUTED]);

            \Modules\Orders\Entities\OrderTracking::create([
                'order_id' => $order->id,
                'order_type' => 'product',
                'user_id' => $order->user_id,
                'status' => \Modules\Orders\Entities\Order::STATUS_DISPUTED,
                'status_message' => 'Dispute opened - order under review',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()->json(['data' => $dispute], 201);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $dispute = Dispute::with('order')->find($id);

        if (!$dispute || $dispute->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Dispute not found'], 404);
        }

        return response()->json(['data' => $dispute]);
    }

    public function resolve(Request $request, string $id): JsonResponse
    {
        $dispute = Dispute::find($id);
        if (!$dispute) {
            return response()->json(['message' => 'Dispute not found'], 404);
        }

        if (!$request->user()->hasPermission('orders.orders.manage')) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $request->validate([
            'resolution' => 'required|in:refund,replacement,credit,dismissed',
            'resolution_notes' => 'nullable|string|max:2000',
        ]);

        $dispute->update([
            'status' => 'resolved',
            'resolution' => $request->resolution,
            'resolution_notes' => $request->resolution_notes,
        ]);

        return response()->json(['data' => $dispute]);
    }

    /**
     * TODO 17 dispute evidence: parties attach files/notes to their own
     * case; evidence accumulates and is never edited in place. Reviewers
     * read it through the admin queues (order or needs scope).
     */
    public function evidence(Request $request, string $id): JsonResponse
    {
        $dispute = Dispute::find($id);
        if (! $dispute || (string) $dispute->user_id !== (string) $request->user()->id) {
            return response()->json(['message' => 'Dispute not found'], 404);
        }

        $rows = DisputeEvidence::with('uploader:id,name')
            ->where('dispute_id', $id)
            ->orderBy('created_at')
            ->get();

        // Private rows resolve to short-lived signed URLs; legacy public
        // rows keep their stored URL (backlog #2 signed-URL attachments).
        $signed = app(\Core\Services\Contracts\SignedStorageServiceInterface::class);
        $data = $rows->map(function (DisputeEvidence $row) use ($signed) {
            $payload = $row->toArray();
            if ($row->disk !== 'public' && $row->file_path) {
                $payload['signed_url'] = $signed->generateSignedUrl($row->file_path, $row->disk, 15, [
                    'entity_type' => 'dispute_evidence',
                    'entity_id' => $row->id,
                    'performed_by' => request()->user()?->id,
                ]);
                $payload['download_url'] = $payload['signed_url'];
            } else {
                $payload['signed_url'] = $row->file_url;
                $payload['download_url'] = $row->file_url;
            }

            return $payload;
        });

        return response()->json(['data' => $data]);
    }

    /**
     * Attaches evidence to a party's own case: either a file upload (stored
     * on the private `local` disk, reachable only through signed URLs) or a
     * legacy external URL. Evidence accumulates and is never edited in place.
     */
    public function addEvidence(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'file_url' => ['nullable', 'url', 'max:500', 'required_without:file'],
            'file' => ['nullable', 'file', 'mimes:jpg,jpeg,png,gif,webp,pdf', 'max:10240', 'required_without:file_url'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $dispute = Dispute::find($id);
        if (! $dispute || (string) $dispute->user_id !== (string) $request->user()->id) {
            return response()->json(['message' => 'Dispute not found'], 404);
        }

        if (in_array($dispute->status, ['resolved', 'closed'], true)) {
            return response()->json(['message' => 'Closed disputes accept no new evidence'], 422);
        }

        $attrs = [
            'dispute_id' => $id,
            'uploaded_by' => $request->user()->id,
            'file_url' => $validated['file_url'] ?? null,
            'note' => $validated['note'] ?? null,
        ];

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $scope = 'disputes/'.$id;
            $path = $file->storeAs($scope, 'evidence-'.\Illuminate\Support\Str::random(32).'.'.strtolower($file->getClientOriginalExtension()), 'local');

            if ($path === false) {
                return response()->json(['message' => 'Evidence upload failed'], 500);
            }

            $attrs['disk'] = 'local';
            $attrs['file_path'] = $path;
            $attrs['original_filename'] = $file->getClientOriginalName();
        }

        $row = DisputeEvidence::create($attrs);

        try {
            app(\Core\Services\Contracts\AuditServiceInterface::class)->log([
                'action' => 'dispute.evidence_added',
                'entity_type' => 'dispute_evidence',
                'entity_id' => $row->id,
                'performed_by' => $request->user()->id,
                'new_values' => [
                    'dispute_id' => $id,
                    'disk' => $row->disk,
                    'original_filename' => $row->original_filename,
                    'has_file' => $row->file_path !== null,
                ],
            ]);
        } catch (\Throwable) {
        }

        $payload = $row->toArray();
        if ($row->disk !== 'public' && $row->file_path) {
            $payload['signed_url'] = app(\Core\Services\Contracts\SignedStorageServiceInterface::class)
                ->generateSignedUrl($row->file_path, $row->disk, 15, [
                    'entity_type' => 'dispute_evidence',
                    'entity_id' => $row->id,
                    'performed_by' => $request->user()?->id,
                ]);
        }

        return response()->json(['message' => 'Evidence attached', 'data' => $payload], 201);
    }

    public function close(Request $request, string $id): JsonResponse
    {
        $dispute = Dispute::find($id);
        if (!$dispute || $dispute->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Dispute not found'], 404);
        }

        $dispute->update(['status' => 'closed']);
        $this->resumeOrder($dispute);

        return response()->json(['data' => $dispute]);
    }

    /**
     * Restore the interrupted order status when a dispute stops being open.
     * A refund resolution keeps the order disputed until the gateway refund
     * marks it refunded (admin-managed).
     */
    private function resumeOrder(Dispute $dispute): void
    {
        if (! $dispute->order_id || ! $dispute->previous_status) {
            return;
        }

        $order = \Modules\Orders\Entities\Order::find($dispute->order_id);

        if (! $order || $order->status !== \Modules\Orders\Entities\Order::STATUS_DISPUTED) {
            return;
        }

        $order->update(['status' => $dispute->previous_status]);

        \Modules\Orders\Entities\OrderTracking::create([
            'order_id' => $order->id,
            'order_type' => 'product',
            'user_id' => $order->user_id,
            'status' => $dispute->previous_status,
            'status_message' => 'Dispute closed - order resumed',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
