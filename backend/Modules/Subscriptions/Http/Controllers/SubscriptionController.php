<?php

namespace Modules\Subscriptions\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Subscriptions\Entities\Plan;
use Modules\Subscriptions\Entities\Subscription;
use Modules\Subscriptions\Entities\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
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

        $plan = Plan::find($validated['plan_id']);

        $subscription = Subscription::create([
            'user_id' => $request->user()->id,
            'plan_id' => $validated['plan_id'],
            'status' => 'active',
            'starts_at' => now(),
            'expires_at' => now()->addDays($plan->duration_days),
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
            $subscription->update(['status' => 'cancelled']);
        }

        return response()->json([
            'message' => 'Subscription cancelled',
        ]);
    }
}
