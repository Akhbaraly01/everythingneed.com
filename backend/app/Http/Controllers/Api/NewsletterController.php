<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Core\Services\Contracts\AuditServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class NewsletterController extends Controller
{
    public function __construct(private AuditServiceInterface $audit) {}

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
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
        ]);

        $query = DB::table('newsletter_subscriptions')->orderByDesc('created_at');

        if ($search = trim((string) ($validated['search'] ?? ''))) {
            $query->where('email', 'ilike', "%{$search}%");
        }

        $subs = $query->paginate($validated['per_page'] ?? 20);

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

    public function destroy(Request $request, string $id): JsonResponse
    {
        $subscriber = DB::table('newsletter_subscriptions')->where('id', $id)->first();
        if (! $subscriber) {
            return response()->json(['message' => 'Subscriber not found'], 404);
        }

        DB::table('newsletter_subscriptions')->where('id', $id)->delete();

        try {
            $this->audit->log([
                'action' => 'newsletter.subscription.removed',
                'entity_type' => 'newsletter_subscription',
                'entity_id' => $id,
                'performed_by' => $request->user()->id,
                'old_values' => ['email' => $subscriber->email],
            ]);
        } catch (\Throwable) {
        }

        return response()->json(['message' => 'Subscriber removed']);
    }

    public function export(Request $request)
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
        ]);

        $search = trim((string) ($validated['search'] ?? ''));

        return response()->streamDownload(function () use ($search) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Email', 'Subscribed at']);

            $query = DB::table('newsletter_subscriptions')->orderBy('created_at');
            if ($search !== '') {
                $query->where('email', 'ilike', "%{$search}%");
            }

            foreach ($query->cursor() as $row) {
                fputcsv($out, [$row->email, $row->created_at]);
            }

            fclose($out);
        }, 'newsletter-subscribers-' . now()->format('Ymd-His') . '.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
