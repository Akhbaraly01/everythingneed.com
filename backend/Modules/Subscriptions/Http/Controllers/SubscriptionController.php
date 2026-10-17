<?php

namespace Modules\Subscriptions\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Subscriptions\Entities\Plan;
use Modules\Subscriptions\Entities\Subscription;
use Modules\Subscriptions\Entities\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SubscriptionController extends Controller
{
    private const INTERVALS = ['daily', 'weekly', 'monthly', 'quarterly', 'biannually', 'yearly'];

    public function plans(): JsonResponse
    {
        $plans = Plan::where('is_active', true)->get();

        return response()->json([
            'data' => $plans,
        ]);
    }

    public function subscribe(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'plan_id' => 'required|uuid|exists:plans,id',
            'payment_method' => 'required|string',
        ]);

        $plan = Plan::where('is_active', true)->find($validated['plan_id']);

        if (!$plan) {
            return response()->json([
                'message' => 'This plan is not available for subscription',
            ], 422);
        }

        $subscription = Subscription::create([
            'user_id' => $request->user()->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'starts_at' => now(),
            'ends_at' => now()->addDays($plan->duration_days ?: 30),
        ]);

        Invoice::create([
            'user_id' => $request->user()->id,
            'subscription_id' => $subscription->id,
            'amount' => $plan->price,
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        return response()->json([
            'message' => 'Subscription created successfully',
            'data' => $subscription,
        ], 201);
    }

    public function mySubscription(Request $request): JsonResponse
    {
        $subscription = Subscription::with(['plan'])
            ->where('user_id', $request->user()->id)
            ->where('status', 'active')
            ->first();

        return response()->json([
            'data' => $subscription,
        ]);
    }

    public function cancel(Request $request): JsonResponse
    {
        $subscription = Subscription::where('user_id', $request->user()->id)
            ->where('status', 'active')
            ->first();

        if ($subscription) {
            $subscription->update(['status' => 'cancelled', 'cancelled_at' => now()]);
        }

        return response()->json([
            'message' => 'Subscription cancelled',
        ]);
    }

    /**
     * Admin console: every plan incl. inactive, with live subscriber counts.
     *
     * GET /api/admin/plans (role: super_admin, administrator)
     */
    public function adminPlans(Request $request): JsonResponse
    {
        $plans = Plan::withCount('subscriptions')
            ->orderBy('price')
            ->paginate((int) $request->get('per_page', 20));

        return response()->json([
            'data' => $plans->items(),
            'meta' => [
                'current_page' => $plans->currentPage(),
                'last_page' => $plans->lastPage(),
                'per_page' => $plans->perPage(),
                'total' => $plans->total(),
            ],
        ]);
    }

    /**
     * POST /api/admin/plans (role: super_admin, administrator)
     */
    public function adminStorePlan(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:plans,slug',
            'description' => 'nullable|string|max:2000',
            'price' => 'required|numeric|min:0',
            'currency' => 'nullable|string|size:3',
            'interval' => 'nullable|string|in:' . implode(',', self::INTERVALS),
            'duration_days' => 'nullable|integer|min:1|max:3650',
            'features' => 'nullable|array',
            'features.*' => 'string|max:120',
            'is_active' => 'nullable|boolean',
        ]);

        $plan = Plan::create([
            'name' => $data['name'],
            'slug' => $data['slug'] ?? Str::slug($data['name']) . '-' . Str::lower(Str::random(6)),
            'description' => $data['description'] ?? null,
            'price' => $data['price'],
            'currency' => strtoupper($data['currency'] ?? 'USD'),
            'interval' => $data['interval'] ?? 'monthly',
            'duration_days' => $data['duration_days'] ?? 30,
            'features' => $data['features'] ?? null,
            'is_active' => $data['is_active'] ?? true,
        ]);

        $this->audit($request, 'create', $plan->id, ['name' => $plan->name]);

        return response()->json([
            'message' => 'Plan created successfully',
            'data' => $plan,
        ], 201);
    }

    /**
     * PUT /api/admin/plans/{id} (role: super_admin, administrator)
     */
    public function adminUpdatePlan(Request $request, string $id): JsonResponse
    {
        $plan = Plan::find($id);
        if (!$plan) {
            return response()->json(['message' => 'Plan not found'], 404);
        }

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|max:255|unique:plans,slug,' . $plan->id,
            'description' => 'nullable|string|max:2000',
            'price' => 'sometimes|numeric|min:0',
            'currency' => 'sometimes|string|size:3',
            'interval' => 'sometimes|string|in:' . implode(',', self::INTERVALS),
            'duration_days' => 'sometimes|integer|min:1|max:3650',
            'features' => 'nullable|array',
            'features.*' => 'string|max:120',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($data === []) {
            return response()->json(['message' => 'No changes provided'], 422);
        }

        if (isset($data['currency'])) {
            $data['currency'] = strtoupper($data['currency']);
        }

        $plan->update($data);

        $this->audit($request, 'update', $plan->id, $data);

        return response()->json([
            'message' => 'Plan updated successfully',
            'data' => $plan->fresh()->loadCount('subscriptions'),
        ]);
    }

    /**
     * DELETE /api/admin/plans/{id} - soft delete; refused while any
     * subscription (incl. historical) references the plan so invoices and
     * subscriber history keep resolving. Deactivate instead.
     * (role: super_admin, administrator)
     */
    public function adminDestroyPlan(Request $request, string $id): JsonResponse
    {
        $plan = Plan::find($id);
        if (!$plan) {
            return response()->json(['message' => 'Plan not found'], 404);
        }

        if ($plan->subscriptions()->exists()) {
            return response()->json([
                'message' => 'This plan has subscriptions and cannot be deleted. Deactivate it instead.',
            ], 422);
        }

        $name = $plan->name;
        $plan->delete();

        $this->audit($request, 'delete', $id, ['name' => $name]);

        return response()->json(['message' => 'Plan deleted']);
    }

    private function audit(Request $request, string $action, string $id, array $values): void
    {
        try {
            app(\Core\Services\Contracts\AuditServiceInterface::class)->log([
                'action' => $action,
                'entity_type' => 'plan',
                'entity_id' => $id,
                'performed_by' => $request->user()?->id,
                'new_values' => $values,
            ]);
        } catch (\Throwable) {
            // Audit failures must not break the operation.
        }
    }
}
