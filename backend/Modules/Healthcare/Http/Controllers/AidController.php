<?php

namespace Modules\Healthcare\Http\Controllers;

use App\Http\Controllers\Controller;
use Core\Services\Contracts\AuditServiceInterface;
use Core\Support\Currencies;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Modules\Healthcare\Entities\AidDonation;
use Modules\Healthcare\Entities\AidRequest;
use Modules\Payments\Services\PaymentService;

/**
 * H-C: Healthcare Aid / Charity - community-funded assistance.
 *
 * Requesters file aid requests (pending), support reviews them
 * (approved/rejected with a reason) and donors fund approved requests
 * through the same PaymentService used everywhere else (idempotent,
 * audited). Money never moves at request time - only at donation.
 */
class AidController extends Controller
{
    public function __construct(
        private PaymentService $payments,
        private AuditServiceInterface $audit,
    ) {}

    /** GET /api/health/aid - public approved/funded listing. */
    public function index(Request $request): JsonResponse
    {
        $query = AidRequest::query()
            ->publiclyVisible()
            ->with('requester:id,name')
            ->orderByDesc('created_at');

        if ($category = $request->query('category')) {
            $query->where('category', $category);
        }
        if ($search = $request->query('q')) {
            $query->where(fn ($q) => $q
                ->where('title', 'ilike', "%{$search}%")
                ->orWhere('description', 'ilike', "%{$search}%"));
        }

        $perPage = min((int) $request->query('per_page', 12), 50);

        return response()->json($query->paginate($perPage)->withQueryString());
    }

    /** GET /api/health/aid/{id} - public detail (or own request). */
    public function show(Request $request, string $id): JsonResponse
    {
        $aid = AidRequest::with(['requester:id,name', 'donations' => fn ($q) => $q->with('donor:id,name')->orderByDesc('created_at')])->find($id);
        if (!$aid) {
            return response()->json(['message' => 'Aid request not found'], 404);
        }

        $isOwner = $request->user() && (string) $aid->user_id === (string) $request->user()->id;
        if (!in_array($aid->status, [AidRequest::STATUS_APPROVED, AidRequest::STATUS_FUNDED], true) && !$isOwner) {
            return response()->json(['message' => 'Aid request not found'], 404);
        }

        return response()->json(['data' => $aid]);
    }

    /** POST /api/health/aid - authed requester files a pending request. */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => 'required|string|max:180',
            'description' => 'required|string|max:4000',
            'category' => 'nullable|string|max:60',
            'goal_amount' => 'required|numeric|min:1|max:100000',
            'idempotency_key' => 'nullable|string|max:120',
        ]);

        $aid = DB::transaction(function () use ($data, $request) {
            if (!empty($data['idempotency_key'])) {
                $existing = AidRequest::where('idempotency_key', $data['idempotency_key'])
                    ->where('user_id', $request->user()->id)
                    ->first();
                if ($existing) {
                    return $existing;
                }
            }

            return AidRequest::create([
                'user_id' => $request->user()->id,
                'title' => $data['title'],
                'description' => $data['description'],
                'category' => $data['category'] ?? null,
                'goal_amount' => (float) $data['goal_amount'],
                'currency' => Currencies::default(),
                'status' => AidRequest::STATUS_PENDING,
                'idempotency_key' => $data['idempotency_key'] ?? null,
            ]);
        });

        $this->auditAid('aid.requested', $aid, $request->user()->id, ['status' => AidRequest::STATUS_PENDING]);

        return response()->json([
            'message' => 'Aid request submitted for review',
            'data' => $aid,
        ], 201);
    }

    /** GET /api/health/aid/mine - requester's own requests. */
    public function myRequests(Request $request): JsonResponse
    {
        $query = AidRequest::where('user_id', $request->user()->id)
            ->orderByDesc('created_at');

        return response()->json($query->paginate(15)->withQueryString());
    }

    /** GET /api/health/aid/donations - donor's own donations. */
    public function myDonations(Request $request): JsonResponse
    {
        $query = AidDonation::where('donor_id', $request->user()->id)
            ->with('aidRequest:id,title,status,goal_amount,raised_amount,currency')
            ->orderByDesc('created_at');

        return response()->json($query->paginate(15)->withQueryString());
    }

    /** POST /api/health/aid/{id}/donate - donate to an approved request. */
    public function donate(Request $request, string $id): JsonResponse
    {
        $aid = AidRequest::find($id);
        if (!$aid) {
            return response()->json(['message' => 'Aid request not found'], 404);
        }
        if (!in_array($aid->status, [AidRequest::STATUS_APPROVED, AidRequest::STATUS_FUNDED], true)) {
            return response()->json(['message' => 'This aid request is not accepting donations'], 422);
        }
        if ((string) $aid->user_id === (string) $request->user()->id) {
            return response()->json(['message' => 'You cannot donate to your own aid request'], 422);
        }

        $data = $request->validate([
            'amount' => 'required|numeric|min:1|max:100000',
            'method' => 'required|string|max:30',
        ]);

        $donationKey = 'aid-'.$aid->id.'-'.$request->user()->id;

        $amount = (float) $data['amount'];

        $payment = $this->payments->charge([
            'user_id' => (string) $request->user()->id,
            'amount' => $amount,
            'currency' => $aid->currency ?: Currencies::default(),
            'method' => $data['method'],
            'idempotency_key' => $donationKey,
            'purpose' => 'aid_donation',
            'metadata' => [
                'aid_request_id' => $aid->id,
                'aid_title' => $aid->title,
            ],
        ]);

        try {
            $donation = DB::transaction(function () use ($aid, $request, $amount, $payment) {
                $donation = AidDonation::create([
                    'aid_request_id' => $aid->id,
                    'donor_id' => $request->user()->id,
                    'amount' => $amount,
                    'currency' => $aid->currency ?: Currencies::default(),
                    'payment_id' => (string) ($payment->id ?? ''),
                    'status' => AidDonation::STATUS_COMPLETED,
                ]);

                $raised = (float) $aid->raised_amount + $amount;
                $status = $raised >= (float) $aid->goal_amount
                    ? AidRequest::STATUS_FUNDED
                    : $aid->status;

                $aid->update(['raised_amount' => $raised, 'status' => $status]);

                return $donation;
            });
        } catch (\Illuminate\Database\QueryException $e) {
            // Unique (aid_request_id, donor_id) - a concurrent submit won;
            // the payment idempotency key already prevented a second charge.
            if ((string) $e->getCode() === '23505') {
                return response()->json(['message' => 'You have already donated to this request'], 422);
            }
            throw $e;
        }

        $this->auditAid('aid.donated', $aid, $request->user()->id, [
            'amount' => $amount,
            'raised_amount' => (float) $aid->fresh()->raised_amount,
        ]);

        return response()->json([
            'message' => 'Donation received',
            'data' => $donation->load('aidRequest:id,title,status,goal_amount,raised_amount,currency'),
        ], 201);
    }

    /** GET /api/admin/healthcare/aid - review queue (all statuses). */
    public function adminList(Request $request): JsonResponse
    {
        $query = AidRequest::with(['requester:id,name', 'reviewer:id,name'])
            ->orderByDesc('created_at');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        return response()->json($query->paginate(20)->withQueryString());
    }

    /** PUT /api/admin/healthcare/aid/{id} - approve or reject. */
    public function adminDecide(Request $request, string $id): JsonResponse
    {
        $aid = AidRequest::find($id);
        if (!$aid) {
            return response()->json(['message' => 'Aid request not found'], 404);
        }
        if ($aid->status !== AidRequest::STATUS_PENDING) {
            return response()->json(['message' => 'Only pending aid requests can be reviewed'], 422);
        }

        $data = $request->validate([
            'action' => 'required|in:approve,reject',
            'reason' => 'nullable|string|max:1000',
        ]);

        $decision = $data['action'] === 'approve'
            ? AidRequest::STATUS_APPROVED
            : AidRequest::STATUS_REJECTED;

        $aid->update([
            'status' => $decision,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'rejection_reason' => $data['action'] === 'reject' ? ($data['reason'] ?? null) : null,
        ]);

        $this->auditAid(
            $data['action'] === 'approve' ? 'aid.approved' : 'aid.rejected',
            $aid,
            $request->user()->id,
            ['status' => $decision],
        );

        return response()->json([
            'message' => $data['action'] === 'approve' ? 'Aid request approved' : 'Aid request rejected',
            'data' => $aid->fresh(['requester:id,name']),
        ]);
    }

    private function auditAid(string $action, AidRequest $aid, string $actorId, array $newValues): void
    {
        try {
            $this->audit->log([
                'action' => $action,
                'entity_type' => 'aid_request',
                'entity_id' => $aid->id,
                'performed_by' => $actorId,
                'old_values' => [],
                'new_values' => $newValues,
            ]);
        } catch (\Throwable) {
        }
    }
}
