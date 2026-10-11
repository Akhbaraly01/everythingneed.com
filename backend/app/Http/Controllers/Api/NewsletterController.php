<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class NewsletterController extends Controller
{
    public function subscribe(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
        ]);

        $email = strtolower(trim($validated['email']));

        $exists = DB::table('newsletter_subscriptions')->where('email', $email)->exists();

        if ($exists) {
            return response()->json(['message' => 'This email is already subscribed.']);
        }

        DB::table('newsletter_subscriptions')->insert([
            'id' => (string) Str::uuid(),
            'email' => $email,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Subscribed successfully.'], 201);
    }

    public function index(Request $request): JsonResponse
    {
        $subs = DB::table('newsletter_subscriptions')
            ->orderByDesc('created_at')
            ->paginate($request->get('per_page', 20));

        return response()->json([
            'data' => $subs->items(),
            'meta' => [
                'current_page' => $subs->currentPage(),
                'last_page' => $subs->lastPage(),
                'per_page' => $subs->perPage(),
                'total' => $subs->total(),
            ],
        ]);
    }
}
