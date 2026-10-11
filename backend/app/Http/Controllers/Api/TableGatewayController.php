<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

/**
 * Table Gateway — the single Laravel-backed data-plane for generic
 * client table operations (list/create/update/delete).
 *
 * Replaces the legacy hosted-DB protocol with strict server-side rules:
 *  - table whitelist
 *  - per-table write policy (column allowlists, not denylists)
 *  - column validation against the live PostgreSQL schema
 *  - operator whitelist
 *  - automatic ownership scoping on every operation
 *
 * Write policy model — clients may write their own content and
 * preferences; they may NEVER write state-machine fields, money,
 * identity/verification fields, engagement counters, or references
 * they do not own:
 *  - 'create'  => columns settable at insert (null = the table is
 *                 read-only through this plane; all mutations belong
 *                 to the module REST APIs).
 *  - 'update'  => columns settable on update (null/omitted = none).
 *  - 'update_values' => column => exact values permitted on update
 *                     (e.g. cancelling your own ticket). Any other
 *                     value is silently stripped.
 * Columns absent from every list are stripped from the payload, so
 * lifecycle columns (status, is_active, approved_at, is_verified,
 * email_verified_at), ownership columns (user_id, patient_id),
 * counters (likes_count …) and amounts (total_amount, consultation_fee
 * on update) can never be flipped through this plane.
 */
class TableGatewayController extends Controller
{
    /**
     * Gateway registry: table => write policy + ownership scope.
     *
     * @var array<string, array{scope: ?string, create?: ?list<string>, update?: ?list<string>, update_values?: array<string, list<string>>}>
     */
    private const TABLES = [
        // ── user-scoped content & preferences (client-writable) ──
        'profiles' => [
            'scope' => 'user_id',
            'create' => ['email', 'full_name', 'phone', 'avatar_url'],
            'update' => ['email', 'full_name', 'phone', 'avatar_url'],
        ],
        'user_settings' => [
            'scope' => 'user_id',
            'create' => ['key', 'value'],
            'update' => ['value'],
        ],
        'addresses' => [
            'scope' => 'user_id',
            'create' => ['line1', 'line2', 'city', 'region', 'postal_code', 'country', 'lat', 'lng', 'is_default'],
            'update' => ['line1', 'line2', 'city', 'region', 'postal_code', 'country', 'lat', 'lng', 'is_default'],
        ],
        'wishlists' => [
            'scope' => 'user_id',
            'create' => ['product_id'],
            'update' => [],
        ],
        'favorites' => [
            'scope' => 'user_id',
            'create' => ['entity_type', 'entity_id'],
            'update' => [],
        ],
        'recently_viewed' => [
            'scope' => 'user_id',
            'create' => ['entity_type', 'entity_id', 'viewed_at'],
            'update' => ['viewed_at'],
        ],
        'expert_wishlists' => [
            'scope' => 'user_id',
            'create' => ['expert_id'],
            'update' => [],
        ],

        // ── learning: content yes, completion state server-owned ──
        // enrollments are created ONLY through LearnService::enroll
        // (POST /api/courses/{id}/enroll), which charges paid courses;
        // a gateway insert would hand out a free enrollment, and
        // enrollments.progress / completed_at are recomputed ONLY by
        // Modules/Learn CompleteLesson (feeds IssueCertificate's
        // progress check) — never client-writable, or certificates
        // could be self-issued by faking completion here.
        'enrollments' => ['scope' => 'user_id'],
        // video_progress is likewise server-owned: CompleteLesson counts
        // `completed = true` rows to recompute enrollment progress, so a
        // client-writable `completed`/`progress_percent` is a direct
        // certificate forgery path. Watch data is persisted by the module
        // REST layer, never by the generic plane.
        'video_progress' => ['scope' => 'user_id'],
        'learn_posts' => [
            'scope' => 'user_id',
            'create' => ['title', 'content', 'category', 'media_type', 'media_url', 'thumbnail_url', 'video_url', 'duration_minutes', 'author_name', 'author_avatar'],
            'update' => ['title', 'content', 'category', 'media_type', 'media_url', 'thumbnail_url', 'video_url', 'duration_minutes', 'author_name', 'author_avatar'],
        ],
        'learn_post_comments' => [
            'scope' => 'user_id',
            'create' => ['post_id', 'content'],
            'update' => ['content'],
        ],
        'learn_post_likes' => [
            'scope' => 'user_id',
            'create' => ['post_id'],
            'update' => [],
        ],

        // ── healthcare: patient content + self-cancel only ────────
        // status flips (assigned/completed/…) and doctor reassignment
        // belong to Modules/Healthcare; patients may cancel their own
        // ticket (update_values) but never set status at insert — the
        // DB default ('pending') applies. Consultation fee is settable
        // only at booking (SPA quote) — BookAppointment overwrites it
        // from the doctor's published fee on assignment.
        'prescriptions' => ['scope' => 'patient_id'],
        'health_tickets' => [
            'scope' => 'patient_id',
            'create' => ['ticket_number', 'symptoms', 'description', 'consultation_type', 'consultation_fee', 'appointment_date', 'appointment_time', 'is_random_assignment', 'doctor_id'],
            'update' => ['symptoms', 'description', 'status'],
            'update_values' => ['status' => ['cancelled']],
        ],

        // ── bookings / orders: created via module REST; gateway ───
        // offers content edits only (no status, no amounts).
        'building_service_bookings' => [
            'scope' => 'user_id',
            'create' => ['worker_type', 'service_category', 'description', 'address', 'scheduled_date', 'scheduled_time', 'estimated_cost', 'notes'],
            'update' => ['description', 'address', 'notes'],
        ],
        'medicine_orders' => ['scope' => 'user_id'],

        // ── user-scoped reads (writes go through module APIs) ─────
        'bookings' => ['scope' => 'user_id'],
        'orders' => ['scope' => 'user_id'],
        'notifications' => ['scope' => 'user_id'],
        'tickets' => ['scope' => 'user_id'],

        // Certificates are issued ONLY via Modules/Learn REST after
        // server-side completion checks — never client-writable.
        'user_certificates' => ['scope' => 'user_id'],

        // ── shared catalog / public data — read-only ──────────────
        // NOTE: conversation/message tables (chat_conversations, chat_messages,
        // ticket_messages, learn_direct_messages) and order internals
        // (vendor_orders, medicine_order_items, order_tracking) are intentionally
        // NOT exposed here: they carry cross-user rows with no safe generic scope.
        // Use their module REST APIs (Messaging, Orders, Pharmacy), which enforce
        // participant/owner/vendor scoping per request.
        'doctors' => ['scope' => null],
        'departments' => ['scope' => null],
        'courses' => ['scope' => null],
        'course_lessons' => ['scope' => null],
        'medicines' => ['scope' => null],
        'need_categories' => ['scope' => null],
        'need_items' => ['scope' => null],
        'expert_availability' => ['scope' => null],
        'expert_reviews' => ['scope' => null],
        'service_workers' => ['scope' => null],
        'health_content' => ['scope' => null],
    ];

    private const OPS = [
        '=' => '=',
        'eq' => '=',
        '!=' => '!=',
        'neq' => '!=',
        '>' => '>',
        'gt' => '>',
        '>=' => '>=',
        'gte' => '>=',
        '<' => '<',
        'lt' => '<',
        '<=' => '<=',
        'lte' => '<=',
        'like' => 'like',
        'ilike' => 'ilike',
        'in' => 'in',
        'contains' => 'contains',
    ];

    public function index(Request $request, string $table): JsonResponse
    {
        $meta = $this->resolveTable($table);
        $columns = Schema::getColumnListing($table);

        $query = DB::table($table);

        $this->applyScope($request, $query, $table, $meta['scope']);

        if ($select = $request->get('select')) {
            $cols = array_intersect(explode(',', (string) $select), $columns);
            if ($cols !== []) {
                $query->select(array_values($cols));
            }
        }

        foreach ($this->parseFilters($request) as [$column, $op, $value]) {
            $this->applyFilter($query, $column, $op, $value, $columns);
        }

        if ($orderBy = $request->get('orderBy')) {
            if (in_array($orderBy, $columns, true)) {
                $direction = strtolower((string) $request->get('order', 'asc')) === 'desc' ? 'desc' : 'asc';
                $query->orderBy($orderBy, $direction);
            }
        } elseif (in_array('created_at', $columns, true)) {
            $query->orderByDesc('created_at');
        }

        $perPage = min(100, max(1, (int) $request->get('limit', 50)));
        $offset = max(0, (int) $request->get('offset', 0));

        $total = (clone $query)->count();
        $rows = $query->offset($offset)->limit($perPage)->get()->map(fn ($r) => (array) $r)->values();

        return response()->json([
            'data' => $rows,
            'meta' => [
                'total' => $total,
                'limit' => $perPage,
                'offset' => $offset,
            ],
        ]);
    }

    public function store(Request $request, string $table): JsonResponse
    {
        $meta = $this->resolveTable($table, true);
        $columns = Schema::getColumnListing($table);

        $payload = collect($request->all())
            ->only($columns)
            ->only($meta['create'] ?? [])
            ->toArray();

        if ($payload === []) {
            return response()->json(['message' => 'No valid fields provided'], 422);
        }

        // Always force ownership server-side; never trust client scope column.
        if ($meta['scope'] && Schema::hasColumn($table, $meta['scope'])) {
            $payload[$meta['scope']] = $request->user()->id;
        }

        if (Schema::hasColumn($table, 'id') && !isset($payload['id'])) {
            $payload['id'] = (string) \Illuminate\Support\Str::uuid();
        }

        $now = now();
        if (Schema::hasColumn($table, 'created_at')) {
            $payload['created_at'] = $now;
        }
        if (Schema::hasColumn($table, 'updated_at')) {
            $payload['updated_at'] = $now;
        }

        try {
            DB::table($table)->insert($payload);
        } catch (\Illuminate\Database\QueryException $e) {
            return response()->json([
                'message' => 'Insert failed',
                'error' => app()->isLocal() ? $e->getMessage() : 'Constraint violation.',
            ], 422);
        }

        $row = DB::table($table)->where('id', $payload['id'])->first();

        return response()->json(['data' => $row], 201);
    }

    public function update(Request $request, string $table, string $id): JsonResponse
    {
        $meta = $this->resolveTable($table, true);

        if (!Schema::hasColumn($table, 'id')) {
            return response()->json(['message' => 'Table has no id column'], 422);
        }

        $columns = Schema::getColumnListing($table);

        $query = DB::table($table)->where('id', $id);
        $this->applyScope($request, $query, $table, $meta['scope']);

        if (!$query->exists()) {
            return response()->json(['message' => 'Record not found'], 404);
        }

        $payload = collect($request->all())
            ->only($columns)
            ->only($meta['update'] ?? [])
            ->toArray();

        foreach ($meta['update_values'] ?? [] as $column => $allowedValues) {
            if (array_key_exists($column, $payload) && !in_array($payload[$column], $allowedValues, true)) {
                unset($payload[$column]);
            }
        }

        if ($payload === []) {
            return response()->json(['message' => 'No valid fields provided'], 422);
        }

        if (Schema::hasColumn($table, 'updated_at')) {
            $payload['updated_at'] = now();
        }

        try {
            DB::table($table)->where('id', $id)->update($payload);
        } catch (\Illuminate\Database\QueryException $e) {
            return response()->json([
                'message' => 'Update failed',
                'error' => app()->isLocal() ? $e->getMessage() : 'Constraint violation.',
            ], 422);
        }

        $row = DB::table($table)->where('id', $id)->first();

        return response()->json(['data' => $row]);
    }

    public function destroy(Request $request, string $table, string $id): JsonResponse
    {
        $meta = $this->resolveTable($table, true);

        if (!Schema::hasColumn($table, 'id')) {
            return response()->json(['message' => 'Table has no id column'], 422);
        }

        $query = DB::table($table)->where('id', $id);
        $this->applyScope($request, $query, $table, $meta['scope']);

        $deleted = $query->delete();

        if (!$deleted) {
            return response()->json(['message' => 'Record not found'], 404);
        }

        return response()->json(['message' => 'Deleted']);
    }

    // ── Internals ────────────────────────────────────────────────

    /**
     * @return array{scope: ?string, create?: ?list<string>, update?: ?list<string>, update_values?: array<string, list<string>>}
     */
    private function resolveTable(string $table, bool $write = false): array
    {
        if (!array_key_exists($table, self::TABLES)) {
            abort(404, "Unknown resource '{$table}'.");
        }

        $policy = self::TABLES[$table];

        if ($write && ($policy['create'] ?? null) === null && ($policy['update'] ?? null) === null) {
            abort(405, "Resource '{$table}' is read-only through the gateway.");
        }

        if (!Schema::hasTable($table)) {
            abort(404, "Resource '{$table}' is not available.");
        }

        return $policy;
    }

    private function applyScope(Request $request, $query, string $table, ?string $scopeColumn): void
    {
        if ($scopeColumn === null) {
            return;
        }

        if (!Schema::hasColumn($table, $scopeColumn)) {
            // Fail closed: never expose unscoped rows when ownership column is missing.
            abort(404, "Resource '{$table}' is not available.");
        }

        $user = $request->user();

        if ($user->hasRole('super_admin') || $user->hasRole('administrator')) {
            return;
        }

        $query->where($scopeColumn, $user->id);
    }

    private function parseFilters(Request $request): array
    {
        $raw = $request->get('filters');

        if (!$raw) {
            return [];
        }

        $filters = is_string($raw) ? json_decode($raw, true) : $raw;

        if (!is_array($filters)) {
            abort(422, 'Invalid filters payload.');
        }

        $parsed = [];

        foreach ($filters as $filter) {
            if (!is_array($filter)) {
                continue;
            }

            // Accept both {column, op, value} objects and [column, op, value] lists
            if (array_is_list($filter) && count($filter) >= 3) {
                [$column, $op, $value] = $filter;
            } else {
                $column = $filter['column'] ?? null;
                $op = $filter['op'] ?? $filter['operator'] ?? null;
                $value = $filter['value'] ?? null;

                if ($column === null || $op === null) {
                    continue;
                }
            }

            if (!is_string($op) || !array_key_exists($op, self::OPS)) {
                abort(422, "Unsupported filter operator '{$op}'.");
            }

            $parsed[] = [(string) $column, self::OPS[$op], $value];
        }

        return $parsed;
    }

    private function applyFilter($query, string $column, string $op, $value, array $columns): void
    {
        if (!in_array($column, $columns, true)) {
            return;
        }

        match ($op) {
            'contains' => $query->where($column, 'ilike', '%'.$this->likeEscape(is_string($value) ? $value : json_encode($value)).'%'),
            'in' => $query->whereIn($column, is_array($value) ? $value : explode(',', (string) $value)),
            'like', 'ilike' => $query->where($column, $op, (string) $value),
            default => $query->where($column, $op, $value),
        };
    }

    private function likeEscape(string $value): string
    {
        return str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $value);
    }
}
