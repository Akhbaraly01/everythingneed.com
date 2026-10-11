<?php

namespace Modules\Needs\Http\Controllers;

use App\Http\Controllers\Controller;
use Core\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Modules\Needs\Entities\NeedCategory;
use Modules\Needs\Entities\NeedOffer;
use Modules\Needs\Entities\NeedRequest;
use Modules\Needs\Entities\NeedRequestEvent;

class NeedRequestController extends Controller
{
    public function __construct(
        private NotificationService $notifications
    ) {}

    /**
     * ?scope=mine (default) | open  — open = public listing for providers.
     */
    public function index(Request $request): JsonResponse
    {
        $scope = $request->get('scope', 'mine');
        $query = NeedRequest::with(['offers', 'category:id,name,slug']);

        if ($scope === 'open') {
            // Public marketplace of requests seeking offers (spec S13 open states)
            $query->whereIn('status', NeedRequest::OPEN_STATUSES);

            if ($request->filled('category_id')) {
                $query->where('category_id', $request->category_id);
            }

            if ($request->filled('category_slug')) {
                $category = NeedCategory::where('slug', $request->category_slug)->first();
                $query->where('category_id', $category?->id);
            }

            if ($request->filled('q')) {
                $q = $request->q;
                $query->where(function ($sub) use ($q) {
                    $sub->where('title', 'ilike', "%{$q}%")
                        ->orWhere('description', 'ilike', "%{$q}%");
                });
            }
        } else {
            $query->where('user_id', $request->user()->id);

            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }
        }

        $requests = $query->orderByDesc('created_at')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $requests->items(),
            'meta' => [
                'current_page' => $requests->currentPage(),
                'last_page' => $requests->lastPage(),
                'per_page' => $requests->perPage(),
                'total' => $requests->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        // W18 (F-03): normalize case before validation so 'ghs' passes.
        // Only merge when a value was given: need_requests.currency is
        // NOT NULL with a DB default that must survive omission.
        $code = \Core\Support\Currencies::normalize($request->input('currency'));
        if ($code !== null) {
            $request->merge(['currency' => $code]);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:5000',
            'category_id' => 'nullable|uuid|exists:need_categories,id',
            'subcategory' => 'nullable|string|max:255',
            'budget_min' => 'nullable|numeric|min:0',
            'budget_max' => 'nullable|numeric|min:0|gte:budget_min',
            'quantity' => 'nullable|integer|min:1|max:1000000',
            'currency' => ['nullable', 'string', 'size:3', \Illuminate\Validation\Rule::in(\Core\Support\Currencies::SUPPORTED)],
            'country' => 'nullable|string|max:120',
            'location' => 'nullable|string|max:255',
            'preferred_date' => 'nullable|date',
            'deadline' => 'nullable|date|after_or_equal:today',
            'attachments' => 'nullable|array',
            'images' => 'nullable|array|max:10',
            'images.*' => 'nullable|string|max:500',
            'service_requirements' => 'nullable|string|max:5000',
            'delivery_requirements' => 'nullable|string|max:5000',
            'notes' => 'nullable|string|max:5000',
            'save_as_draft' => 'nullable|boolean',
        ]);

        $isDraft = (bool) ($validated['save_as_draft'] ?? false);
        unset($validated['save_as_draft']);

        try {
            $needRequest = DB::transaction(function () use ($request, $validated, $isDraft) {
                $row = NeedRequest::create(array_merge($validated, [
                    'user_id' => $request->user()->id,
                    'request_number' => 'NR-'.strtoupper(uniqid()),
                    'status' => $isDraft ? NeedRequest::STATUS_DRAFT : NeedRequest::STATUS_PENDING,
                ]));

                $this->record($row, null, $row->status, 'create', $isDraft ? 'Draft saved' : 'Submitted');

                return $row;
            });
        } catch (\Core\Exceptions\ValidationException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => $isDraft
                ? 'Draft saved. Finish it any time from My Needs.'
                : 'Request submitted. Our team will review it shortly.',
            'data' => $needRequest,
        ], 201);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $needRequest = NeedRequest::with([
            'offers.provider',
            'category:id,name,slug',
            'user:id,name',
            'events.actor:id,name',
        ])->find($id);

        if (!$needRequest) {
            return response()->json(['message' => 'Request not found'], 404);
        }

        $isOwner = (string) $needRequest->user_id === (string) $request->user()->id;
        $isAdmin = $this->isAdmin($request);
        $hasOffered = $needRequest->offers->contains('provider_id', $request->user()->id);

        // Non-owners who never offered may only view publicly listed requests
        if (!$isOwner && !$isAdmin && !$hasOffered) {
            if (!in_array($needRequest->status, NeedRequest::OPEN_STATUSES, true)) {
                return response()->json(['message' => 'You do not have access to this request'], 403);
            }
        }

        $data = $needRequest->toArray();

        // Spec S12 timeline (transition history) for everyone who can view.
        $data['timeline'] = ($data['events'] ?? []) ?? [];

        // Spec S12 payment state - owner/admin only.
        $data['payment'] = null;
        if ($isOwner || $isAdmin) {
            $payment = \Modules\Payments\Entities\Payment::where('order_id', $needRequest->id)
                ->where('reference', 'like', 'NRPAY-%')
                ->orderByDesc('created_at')
                ->first();
            if ($payment) {
                $data['payment'] = [
                    'reference' => $payment->reference,
                    'amount' => $payment->amount,
                    'currency' => $payment->currency ?? \Core\Support\Currencies::default(),
                    'status' => $payment->status,
                    'created_at' => $payment->created_at,
                ];
            }
        }

        // Hide competing offer details from non-owners
        if (!$isOwner && !$isAdmin) {
            $data['offers'] = array_values(array_filter(
                $data['offers'] ?? [],
                fn ($o) => ($o['provider_id'] ?? null) === $request->user()->id
            ));
        }

        return response()->json(['data' => $data]);
    }

    public function offers(Request $request, string $id): JsonResponse
    {
        $needRequest = NeedRequest::with(['offers.provider'])->find($id);

        if (!$needRequest) {
            return response()->json(['message' => 'Request not found'], 404);
        }

        $isOwner = (string) $needRequest->user_id === (string) $request->user()->id;
        if (!$isOwner && !$this->isAdmin($request)) {
            return response()->json(['message' => 'Only the request owner can view all offers'], 403);
        }

        return response()->json(['data' => $needRequest->offers]);
    }

    public function submitOffer(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'price' => 'required|numeric|min:0.01',
            'message' => 'nullable|string|max:2000',
        ]);

        $needRequest = NeedRequest::where('id', $id)->lockForUpdate()->first();

        if (!$needRequest) {
            return response()->json(['message' => 'Request not found'], 404);
        }

        if ((string) $needRequest->user_id === (string) $request->user()->id) {
            return response()->json(['message' => 'You cannot bid on your own request'], 422);
        }

        if (!in_array($needRequest->status, NeedRequest::OPEN_STATUSES, true)) {
            return response()->json(['message' => "This request is no longer accepting offers ('{$needRequest->status}')"], 422);
        }

        $existing = NeedOffer::where('need_request_id', $id)
            ->where('provider_id', $request->user()->id)
            ->first();

        $isNegotiation = (bool) $existing;

        if ($existing) {
            // Negotiation: update the standing offer while still open
            if ($existing->status !== NeedOffer::STATUS_ACCEPTED) {
                $existing->update([
                    'price' => $validated['price'],
                    'message' => $validated['message'] ?? $existing->message,
                    'status' => NeedOffer::STATUS_PENDING,
                ]);
            } else {
                return response()->json(['message' => 'Your offer was already accepted'], 422);
            }

            $offer = $existing;
        } else {
            $offer = NeedOffer::create(array_merge($validated, [
                'need_request_id' => $id,
                'provider_id' => $request->user()->id,
                'status' => NeedOffer::STATUS_PENDING,
            ]));
        }

        $previous = $needRequest->status;
        // Spec S13: re-submitting a standing offer moves the request into
        // Negotiation; a first offer marks it as Offers Received.
        $needRequest->update([
            'status' => $isNegotiation ? NeedRequest::STATUS_NEGOTIATING : NeedRequest::STATUS_OFFERED,
        ]);
        $this->record($needRequest, $previous, $needRequest->status, $isNegotiation ? 'negotiate' : 'offer');

        $this->notifications->notify(
            (string) $needRequest->user_id,
            $isNegotiation ? 'Updated offer on your request' : 'New offer on your request',
            "You received an offer of \${$offer->price} for '{$needRequest->title}'.",
            'need_offer',
            $needRequest->id
        );

        return response()->json([
            'message' => 'Offer submitted',
            'data' => $offer,
        ], 201);
    }

    public function acceptOffer(Request $request, string $id, string $offerId): JsonResponse
    {
        $needRequest = NeedRequest::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$needRequest) {
            return response()->json(['message' => 'Request not found'], 404);
        }

        if (!in_array($needRequest->status, NeedRequest::OPEN_STATUSES, true)) {
            return response()->json(['message' => "Cannot accept offers in status '{$needRequest->status}'"], 422);
        }

        $offer = NeedOffer::where('id', $offerId)
            ->where('need_request_id', $id)
            ->where('status', NeedOffer::STATUS_PENDING)
            ->first();

        if (!$offer) {
            return response()->json(['message' => 'Pending offer not found'], 404);
        }

        $previous = $needRequest->status;
        DB::transaction(function () use ($needRequest, $offer) {
            NeedOffer::where('need_request_id', $needRequest->id)
                ->where('status', NeedOffer::STATUS_PENDING)
                ->update(['status' => NeedOffer::STATUS_REJECTED]);

            $offer->update(['status' => NeedOffer::STATUS_ACCEPTED]);
            $needRequest->update(['status' => NeedRequest::STATUS_ACCEPTED]);
        });
        $this->record($needRequest, $previous, NeedRequest::STATUS_ACCEPTED, 'accept_offer');

        $this->notifications->notify(
            (string) $offer->provider_id,
            'Your offer was accepted!',
            "'{$needRequest->title}' — awaiting payment to begin work.",
            'need_offer_accepted',
            $needRequest->id
        );

        return response()->json([
            'message' => 'Offer accepted. Proceed to payment.',
            'data' => [
                'request' => $needRequest->fresh(),
                'accepted_offer' => $offer->fresh(),
            ],
        ]);
    }

    public function rejectOffer(Request $request, string $id, string $offerId): JsonResponse
    {
        $needRequest = NeedRequest::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$needRequest) {
            return response()->json(['message' => 'Request not found'], 404);
        }

        if (!in_array($needRequest->status, NeedRequest::OPEN_STATUSES, true)) {
            return response()->json(['message' => "Cannot reject offers in status '{$needRequest->status}'"], 422);
        }

        $offer = NeedOffer::where('id', $offerId)
            ->where('need_request_id', $id)
            ->where('status', NeedOffer::STATUS_PENDING)
            ->first();

        if (!$offer) {
            return response()->json(['message' => 'Pending offer not found'], 404);
        }

        $offer->update(['status' => NeedOffer::STATUS_REJECTED]);
        $this->record($needRequest, $needRequest->status, $needRequest->status, 'reject_offer', "Offer {$offer->id} rejected");

        $this->notifications->notify(
            (string) $offer->provider_id,
            'Offer declined',
            "'{$needRequest->title}' — your offer was declined.",
            'need_offer_rejected',
            $needRequest->id
        );

        $remaining = NeedOffer::where('need_request_id', $id)
            ->where('status', NeedOffer::STATUS_PENDING)
            ->count();

        if ($remaining === 0) {
            $previous = $needRequest->status;
            $needRequest->update(['status' => NeedRequest::STATUS_REVIEWING]);
            $this->record($needRequest, $previous, NeedRequest::STATUS_REVIEWING, 'reviewing');
        }

        return response()->json([
            'message' => 'Offer rejected.',
            'data' => [
                'request' => $needRequest->fresh(),
                'offer' => $offer->fresh(),
            ],
        ]);
    }

    /**
     * Pay for the accepted offer — server-authoritative amount.
     * Spec S13: reachable from Accepted directly or through Payment Pending.
     */
    public function pay(Request $request, string $id): JsonResponse
    {
        $needRequest = NeedRequest::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$needRequest) {
            return response()->json(['message' => 'Request not found'], 404);
        }

        if (!in_array($needRequest->status, [NeedRequest::STATUS_ACCEPTED, NeedRequest::STATUS_PAYMENT_PENDING], true)) {
            return response()->json(['message' => 'Accept an offer before paying'], 422);
        }

        $offer = $needRequest->acceptedOffer;

        if (!$offer || $offer->status !== NeedOffer::STATUS_ACCEPTED) {
            return response()->json(['message' => 'No accepted offer found'], 422);
        }

        $previous = $needRequest->status;
        $payment = DB::transaction(function () use ($needRequest, $offer, $request) {
            // Routed through the payment abstraction (§25) — server owns the
            // amount (accepted offer price), never the client.
            $result = app(\Core\Services\Contracts\PaymentGatewayInterface::class)->charge([
                'order_id' => $needRequest->id,
                'user_id' => $request->user()->id,
                'amount' => $offer->price,
                'currency' => $needRequest->currency ?: \Core\Support\Currencies::default(),
                'method' => $request->input('method', 'card'),
                'reference' => 'NRPAY-'.strtoupper(uniqid()),
                'idempotency_key' => 'NRPAY-'.$needRequest->id,
                'purpose' => 'need_payment',
            ]);

            if (!($result['success'] ?? false)) {
                throw new \RuntimeException($result['error'] ?? 'Payment failed');
            }

            $payment = \Modules\Payments\Entities\Payment::find($result['payment_id']);
            $payment->update(['gateway_response' => array_merge(
                (array) ($payment->gateway_response ?? []),
                ['kind' => 'need_request'],
            )]);

            $needRequest->update(['status' => NeedRequest::STATUS_PAID]);

            return $payment;
        });
        $this->record($needRequest, $previous, NeedRequest::STATUS_PAID, 'pay');

        $this->notifications->notify(
            (string) $offer->provider_id,
            'Payment received',
            "'{$needRequest->title}' is paid — you can start work now.",
            'need_paid',
            $needRequest->id
        );

        return response()->json([
            'message' => 'Payment successful',
            'data' => [
                'payment_reference' => $payment->reference,
                'amount' => $payment->amount,
                'request_status' => NeedRequest::STATUS_PAID,
            ],
        ], 201);
    }

    /**
     * Server-controlled lifecycle transitions (spec S13). Every transition
     * is authorized here - the client can never write status directly.
     *
     *  owner:      submit (draft→pending), publish, payment, cancel, expire
     *  provider:   start, fulfill, complete, dispute
     *  moderator:  reject, expire, refund, (+ provider/owner powers)
     */
    public function transition(Request $request, string $id, string $action): JsonResponse
    {
        $needRequest = NeedRequest::find($id);

        if (!$needRequest) {
            return response()->json(['message' => 'Request not found'], 404);
        }

        $user = $request->user();
        $isOwner = (string) $needRequest->user_id === (string) $user->id;
        $isProvider = $needRequest->acceptedOffer
            && (string) $needRequest->acceptedOffer->provider_id === (string) $user->id;
        $isModerator = $this->isModerator($request);
        $status = $needRequest->status;

        switch ($action) {
            case 'submit':
                if (!$isOwner) {
                    return response()->json(['message' => 'Only the owner can submit this request'], 403);
                }
                if ($status !== NeedRequest::STATUS_DRAFT) {
                    return response()->json(['message' => "Only drafts can be submitted ('{$status}')"], 422);
                }
                $needRequest->update(['status' => NeedRequest::STATUS_PENDING]);
                $this->record($needRequest, $status, NeedRequest::STATUS_PENDING, 'submit');
                $message = 'Request submitted';
                break;

            case 'publish':
                if (!$isOwner) {
                    return response()->json(['message' => 'Only the owner can publish this request'], 403);
                }
                if ($status !== NeedRequest::STATUS_PENDING) {
                    return response()->json(['message' => "Only submitted requests can be published ('{$status}')"], 422);
                }
                $needRequest->update(['status' => NeedRequest::STATUS_PUBLISHED]);
                $this->record($needRequest, $status, NeedRequest::STATUS_PUBLISHED, 'publish');
                $message = 'Request published';
                break;

            case 'payment':
                if (!$isOwner) {
                    return response()->json(['message' => 'Only the owner can proceed to payment'], 403);
                }
                if ($status !== NeedRequest::STATUS_ACCEPTED) {
                    return response()->json(['message' => "Payment can only follow acceptance ('{$status}')"], 422);
                }
                $needRequest->update(['status' => NeedRequest::STATUS_PAYMENT_PENDING]);
                $this->record($needRequest, $status, NeedRequest::STATUS_PAYMENT_PENDING, 'payment');
                $message = 'Awaiting payment';
                break;

            case 'start':
                if (!$isProvider) {
                    return response()->json(['message' => 'Only the accepted provider can start work'], 403);
                }
                if ($status !== NeedRequest::STATUS_PAID) {
                    return response()->json(['message' => 'Work can only start once paid'], 422);
                }
                $needRequest->update(['status' => NeedRequest::STATUS_IN_PROGRESS]);
                $this->record($needRequest, $status, NeedRequest::STATUS_IN_PROGRESS, 'start');
                $message = 'Work started';
                break;

            case 'fulfill':
                if (!$isProvider && !$isModerator) {
                    return response()->json(['message' => 'Only the accepted provider can submit delivered work'], 403);
                }
                if ($status !== NeedRequest::STATUS_IN_PROGRESS) {
                    return response()->json(['message' => "Work can only be fulfilled while in progress ('{$status}')"], 422);
                }
                $needRequest->update(['status' => NeedRequest::STATUS_FULFILLED]);
                $this->record($needRequest, $status, NeedRequest::STATUS_FULFILLED, 'fulfill');
                $this->notifications->notify(
                    (string) $needRequest->user_id,
                    'Work delivered',
                    "'{$needRequest->title}' has been submitted for your review.",
                    'need_fulfilled',
                    $needRequest->id
                );
                $message = 'Work submitted for review';
                break;

            case 'complete':
                if (!$isProvider && !$isModerator) {
                    return response()->json(['message' => 'Only the accepted provider can complete work'], 403);
                }
                if (!in_array($status, [NeedRequest::STATUS_IN_PROGRESS, NeedRequest::STATUS_FULFILLED], true)) {
                    return response()->json(['message' => 'Work has not started yet'], 422);
                }
                $offer = $needRequest->acceptedOffer;

                DB::transaction(function () use ($needRequest, $offer) {
                    $needRequest->update(['status' => NeedRequest::STATUS_COMPLETED]);

                    // Release the escrowed funds to the accepted provider —
                    // same payment abstraction as TaskController::mark-paid
                    // (§25). Distinct idempotency prefix from NRPAY-* (owner
                    // charge), so the payout can never collide with it.
                    if ($offer) {
                        $result = app(\Core\Services\Contracts\PaymentGatewayInterface::class)->charge([
                            'order_id' => $needRequest->id,
                            'user_id' => (string) $offer->provider_id,
                            'amount' => $offer->price,
                            'currency' => $needRequest->currency ?: \Core\Support\Currencies::default(),
                            'method' => 'platform_escrow',
                            'reference' => 'NEEDPAYOUT-'.strtoupper(uniqid()),
                            'idempotency_key' => 'NEEDPAYOUT-'.$needRequest->id,
                            'purpose' => 'need_payout',
                        ]);

                        if (!($result['success'] ?? false)) {
                            throw new \RuntimeException($result['error'] ?? 'Payout failed');
                        }

                        $payout = \Modules\Payments\Entities\Payment::find($result['payment_id']);
                        if ($payout) {
                            $payout->update(['gateway_response' => array_merge(
                                (array) ($payout->gateway_response ?? []),
                                ['kind' => 'need_payout'],
                            )]);
                        }
                    }
                });
                $this->record($needRequest, $status, NeedRequest::STATUS_COMPLETED, 'complete');

                $this->notifications->notify(
                    (string) $needRequest->user_id,
                    'Your request is completed',
                    "'{$needRequest->title}' has been marked as completed.",
                    'need_completed',
                    $needRequest->id
                );
                if ($offer) {
                    $this->notifications->notify(
                        (string) $offer->provider_id,
                        'Payment released',
                        "'{$needRequest->title}' — \${$offer->price} payout has been released.",
                        'need_payout',
                        $needRequest->id
                    );
                }
                $message = 'Work completed';
                break;

            case 'cancel':
                if (!$isOwner && !$isModerator) {
                    return response()->json(['message' => 'Only the owner can cancel this request'], 403);
                }
                if (!in_array($status, [
                    NeedRequest::STATUS_PENDING,
                    NeedRequest::STATUS_PUBLISHED,
                    NeedRequest::STATUS_REVIEWING,
                    NeedRequest::STATUS_OFFERED,
                    NeedRequest::STATUS_NEGOTIATING,
                    NeedRequest::STATUS_PAYMENT_PENDING,
                ], true)) {
                    return response()->json(['message' => "Cannot cancel in status '{$status}'"], 422);
                }
                $needRequest->update(['status' => NeedRequest::STATUS_CANCELLED]);
                $this->record($needRequest, $status, NeedRequest::STATUS_CANCELLED, 'cancel');
                $message = 'Request cancelled';
                break;

            case 'reject':
                if (!$isModerator) {
                    return response()->json(['message' => 'Only a moderator can reject this request'], 403);
                }
                if (!in_array($status, [
                    NeedRequest::STATUS_PENDING,
                    NeedRequest::STATUS_PUBLISHED,
                    NeedRequest::STATUS_REVIEWING,
                    NeedRequest::STATUS_OFFERED,
                    NeedRequest::STATUS_NEGOTIATING,
                    NeedRequest::STATUS_ACCEPTED,
                ], true)) {
                    return response()->json(['message' => "Cannot reject in status '{$status}'"], 422);
                }
                $needRequest->update(['status' => NeedRequest::STATUS_REJECTED]);
                $this->record($needRequest, $status, NeedRequest::STATUS_REJECTED, 'reject');
                $this->notifications->notify(
                    (string) $needRequest->user_id,
                    'Request rejected',
                    "'{$needRequest->title}' was rejected by the moderation team.",
                    'need_rejected',
                    $needRequest->id
                );
                $message = 'Request rejected';
                break;

            case 'expire':
                if (!$isOwner && !$isModerator) {
                    return response()->json(['message' => 'Only the owner or a moderator can expire this request'], 403);
                }
                if (!in_array($status, NeedRequest::OPEN_STATUSES, true) && $status !== NeedRequest::STATUS_DRAFT) {
                    return response()->json(['message' => "Cannot expire in status '{$status}'"], 422);
                }
                $needRequest->update(['status' => NeedRequest::STATUS_EXPIRED]);
                $this->record($needRequest, $status, NeedRequest::STATUS_EXPIRED, 'expire');
                $this->notifications->notify(
                    (string) $needRequest->user_id,
                    'Request expired',
                    "'{$needRequest->title}' has expired and no longer accepts offers.",
                    'need_expired',
                    $needRequest->id
                );
                $message = 'Request expired';
                break;

            case 'dispute':
                if (!$isOwner && !$isProvider) {
                    return response()->json(['message' => 'Only the owner or the provider can raise a dispute'], 403);
                }
                if (!in_array($status, [
                    NeedRequest::STATUS_PAID,
                    NeedRequest::STATUS_IN_PROGRESS,
                    NeedRequest::STATUS_FULFILLED,
                ], true)) {
                    return response()->json(['message' => "Disputes can only be raised while work is underway ('{$status}')"], 422);
                }
                $needRequest->update(['status' => NeedRequest::STATUS_DISPUTED]);
                $this->record($needRequest, $status, NeedRequest::STATUS_DISPUTED, 'dispute');
                $counterparty = $isOwner
                    ? ($needRequest->acceptedOffer?->provider_id)
                    : $needRequest->user_id;
                if ($counterparty) {
                    $this->notifications->notify(
                        (string) $counterparty,
                        'Dispute opened',
                        "'{$needRequest->title}' has been disputed and is under review.",
                        'need_disputed',
                        $needRequest->id
                    );
                }
                $message = 'Dispute opened';
                break;

            case 'refund':
                if (!$isModerator) {
                    return response()->json(['message' => 'Only a moderator can refund this request'], 403);
                }
                if ($status !== NeedRequest::STATUS_DISPUTED) {
                    return response()->json(['message' => "Refunds follow a dispute ('{$status}')"], 422);
                }

                $payment = \Modules\Payments\Entities\Payment::where('order_id', $needRequest->id)
                    ->where('reference', 'like', 'NRPAY-%')
                    ->where('status', \Modules\Payments\Entities\Payment::STATUS_SUCCEEDED)
                    ->orderByDesc('created_at')
                    ->first();
                if (!$payment) {
                    return response()->json(['message' => 'No refundable payment found for this request'], 422);
                }

                $refund = app(\Core\Services\Contracts\PaymentGatewayInterface::class)->refund([
                    'payment_id' => $payment->id,
                    'amount' => $payment->amount,
                    'reason' => 'Need request disputed: '.$needRequest->request_number,
                ]);
                if (!($refund['success'] ?? false)) {
                    return response()->json(['message' => 'Refund failed: '.($refund['error'] ?? 'unknown error')], 422);
                }

                $needRequest->update(['status' => NeedRequest::STATUS_REFUNDED]);
                $this->record($needRequest, $status, NeedRequest::STATUS_REFUNDED, 'refund', 'Refund '.$refund['refund_id']);
                $offer = $needRequest->acceptedOffer;
                if ($offer) {
                    $this->notifications->notify(
                        (string) $offer->provider_id,
                        'Payment refunded',
                        "'{$needRequest->title}' was refunded to the requester.",
                        'need_refunded',
                        $needRequest->id
                    );
                }
                $message = 'Payment refunded';
                break;

            default:
                return response()->json(['message' => "Unknown action '{$action}'"], 404);
        }

        return response()->json([
            'message' => $message,
            'data' => $needRequest->fresh(),
        ]);
    }

    private function record(NeedRequest $needRequest, ?string $from, string $to, string $action, ?string $note = null): void
    {
        NeedRequestEvent::create([
            'need_request_id' => $needRequest->id,
            'actor_id' => auth('sanctum')->id() ?? auth()->id(),
            'from_status' => $from,
            'to_status' => $to,
            'action' => $action,
            'note' => $note,
        ]);
    }

    private function isAdmin(Request $request): bool
    {
        return $request->user()->hasRole('super_admin')
            || $request->user()->hasRole('administrator');
    }

    /** Moderation powers for reject/expire/refund (spec S13 terminal states). */
    private function isModerator(Request $request): bool
    {
        return $this->isAdmin($request)
            || $request->user()->hasRole('needs_admin')
            || $request->user()->hasRole('platform_ops');
    }
}
