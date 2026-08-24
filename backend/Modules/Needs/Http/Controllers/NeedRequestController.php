<?php

namespace Modules\Needs\Http\Controllers;

use App\Http\Controllers\Controller;
use Core\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Modules\Needs\Entities\NeedOffer;
use Modules\Needs\Entities\NeedRequest;

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
        $query = NeedRequest::with(['offers']);

        if ($scope === 'open') {
            // Public marketplace of requests seeking offers
            $query->whereIn('status', [
                NeedRequest::STATUS_PENDING,
                NeedRequest::STATUS_REVIEWING,
                NeedRequest::STATUS_OFFERED,
            ]);

            if ($request->filled('category_id')) {
                $query->where('category_id', $request->category_id);
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
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:5000',
            'category_id' => 'nullable|uuid|exists:need_categories,id',
            'budget_min' => 'nullable|numeric|min:0',
            'budget_max' => 'nullable|numeric|min:0|gte:budget_min',
            'location' => 'nullable|string|max:255',
            'deadline' => 'nullable|date|after_or_equal:today',
            'attachments' => 'nullable|array',
        ]);

        try {
            $needRequest = DB::transaction(function () use ($request, $validated) {
                return NeedRequest::create(array_merge($validated, [
                    'user_id' => $request->user()->id,
                    'request_number' => 'NR-'.strtoupper(uniqid()),
                    'status' => NeedRequest::STATUS_PENDING,
                ]));
            });
        } catch (\Core\Exceptions\ValidationException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Request submitted. Our team will review it shortly.',
            'data' => $needRequest,
        ], 201);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $needRequest = NeedRequest::with(['offers.provider'])->find($id);

        if (!$needRequest) {
            return response()->json(['message' => 'Request not found'], 404);
        }

        $isOwner = (string) $needRequest->user_id === (string) $request->user()->id;
        $isAdmin = $this->isAdmin($request);
        $hasOffered = $needRequest->offers->contains('provider_id', $request->user()->id);

        // Non-owners who never offered may only view publicly listed requests
        if (!$isOwner && !$isAdmin && !$hasOffered) {
            if (!in_array($needRequest->status, [NeedRequest::STATUS_PENDING, NeedRequest::STATUS_REVIEWING, NeedRequest::STATUS_OFFERED], true)) {
                return response()->json(['message' => 'You do not have access to this request'], 403);
            }
        }

        // Hide competing offer details from non-owners
        $data = $needRequest->toArray();
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

        if (!in_array($needRequest->status, [
            NeedRequest::STATUS_PENDING,
            NeedRequest::STATUS_REVIEWING,
            NeedRequest::STATUS_OFFERED,
        ], true)) {
            return response()->json(['message' => "This request is no longer accepting offers ('{$needRequest->status}')"], 422);
        }

        $existing = NeedOffer::where('need_request_id', $id)
            ->where('provider_id', $request->user()->id)
            ->first();

        if ($existing) {
            // Negotiation: update the standing offer while still pending
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

        $needRequest->update(['status' => NeedRequest::STATUS_OFFERED]);

        $this->notifications->notify(
            (string) $needRequest->user_id,
            'New offer on your request',
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

        if (!in_array($needRequest->status, [
            NeedRequest::STATUS_OFFERED,
            NeedRequest::STATUS_REVIEWING,
            NeedRequest::STATUS_PENDING,
        ], true)) {
            return response()->json(['message' => "Cannot accept offers in status '{$needRequest->status}'"], 422);
        }

        $offer = NeedOffer::where('id', $offerId)
            ->where('need_request_id', $id)
            ->where('status', NeedOffer::STATUS_PENDING)
            ->first();

        if (!$offer) {
            return response()->json(['message' => 'Pending offer not found'], 404);
        }

        DB::transaction(function () use ($needRequest, $offer) {
            NeedOffer::where('need_request_id', $needRequest->id)
                ->where('status', NeedOffer::STATUS_PENDING)
                ->update(['status' => NeedOffer::STATUS_REJECTED]);

            $offer->update(['status' => NeedOffer::STATUS_ACCEPTED]);
            $needRequest->update(['status' => NeedRequest::STATUS_ACCEPTED]);
        });

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

    /**
     * Pay for the accepted offer — server-authoritative amount.
     */
    public function pay(Request $request, string $id): JsonResponse
    {
        $needRequest = NeedRequest::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$needRequest) {
            return response()->json(['message' => 'Request not found'], 404);
        }

        if ($needRequest->status !== NeedRequest::STATUS_ACCEPTED) {
            return response()->json(['message' => 'Accept an offer before paying'], 422);
        }

        $offer = $needRequest->acceptedOffer;

        if (!$offer || $offer->status !== NeedOffer::STATUS_ACCEPTED) {
            return response()->json(['message' => 'No accepted offer found'], 422);
        }

        $payment = DB::transaction(function () use ($needRequest, $offer, $request) {
            $payment = \Modules\Payments\Entities\Payment::create([
                'order_id' => $needRequest->id,
                'user_id' => $request->user()->id,
                'amount' => $offer->price,
                'currency' => 'USD',
                'status' => 'pending',
                'method' => $request->input('method', 'card'),
                'reference' => 'NRPAY-'.strtoupper(uniqid()),
                'gateway_response' => json_encode([
                    'provider' => 'everythingneed-pay',
                    'transaction_id' => 'TXN-'.strtoupper(uniqid()),
                    'mode' => config('app.env') === 'production' ? 'live' : 'test',
                    'kind' => 'need_request',
                ]),
            ]);

            $payment->update(['status' => 'succeeded']);

            $needRequest->update(['status' => NeedRequest::STATUS_PAID]);

            return $payment;
        });

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
     * Lifecycle transitions after payment:
     *  - provider: start (paid→in_progress), complete (in_progress→completed)
     *  - owner/admin: cancel while pending/reviewing/offered
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

        switch ($action) {
            case 'start':
                if (!$isProvider) {
                    return response()->json(['message' => 'Only the accepted provider can start work'], 403);
                }
                if ($needRequest->status !== NeedRequest::STATUS_PAID) {
                    return response()->json(['message' => 'Work can only start once paid'], 422);
                }
                $needRequest->update(['status' => NeedRequest::STATUS_IN_PROGRESS]);
                $message = 'Work started';
                break;

            case 'complete':
                if (!$isProvider && !$this->isAdmin($request)) {
                    return response()->json(['message' => 'Only the accepted provider can complete work'], 403);
                }
                if ($needRequest->status !== NeedRequest::STATUS_IN_PROGRESS) {
                    return response()->json(['message' => 'Work has not started yet'], 422);
                }
                $needRequest->update(['status' => NeedRequest::STATUS_COMPLETED]);
                $this->notifications->notify(
                    (string) $needRequest->user_id,
                    'Your request is completed',
                    "'{$needRequest->title}' has been marked as completed.",
                    'need_completed',
                    $needRequest->id
                );
                $message = 'Work completed';
                break;

            case 'cancel':
                if (!$isOwner && !$this->isAdmin($request)) {
                    return response()->json(['message' => 'Only the owner can cancel this request'], 403);
                }
                if (!in_array($needRequest->status, [
                    NeedRequest::STATUS_PENDING,
                    NeedRequest::STATUS_REVIEWING,
                    NeedRequest::STATUS_OFFERED,
                ], true)) {
                    return response()->json(['message' => "Cannot cancel in status '{$needRequest->status}'"], 422);
                }
                $needRequest->update(['status' => NeedRequest::STATUS_CANCELLED]);
                $message = 'Request cancelled';
                break;

            default:
                return response()->json(['message' => "Unknown action '{$action}'"], 404);
        }

        return response()->json([
            'message' => $message,
            'data' => $needRequest->fresh(),
        ]);
    }

    private function isAdmin(Request $request): bool
    {
        return $request->user()->hasRole('super_admin')
            || $request->user()->hasRole('administrator');
    }
}
