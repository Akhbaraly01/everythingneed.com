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
 *  - column validation against the live PostgreSQL schema
 *  - operator whitelist
 *  - automatic ownership scoping on every operation
 */
class TableGatewayController extends Controller
{
    /**
     * Gateway registry: table => [ownership column|null, writable].
     * Shared catalogs are readable but never writable through this plane;
     * mutations for those belong to their module's REST resources.
     *
     * @var array<string, array{scope: ?string, write: bool}>
     */
    private const TABLES = [
        // user-scoped, fully writable
        'profiles' => ['scope' => 'user_id', 'write' => true],
        'user_settings' => ['scope' => 'user_id', 'write' => true],
        'wishlists' => ['scope' => 'user_id', 'write' => true],
        'favorites' => ['scope' => 'user_id', 'write' => true],
        'recently_viewed' => ['scope' => 'user_id', 'write' => true],
        'video_progress' => ['scope' => 'user_id', 'write' => true],
        // Certificates are issued ONLY via Modules/Learn REST API after
        // server-side completion checks — never client-writable.
        'user_certificates' => ['scope' => 'user_id', 'write' => false],
        'enrollments' => ['scope' => 'user_id', 'write' => true],
        'learn_posts' => ['scope' => 'user_id', 'write' => true],
        'learn_post_comments' => ['scope' => 'user_id', 'write' => true],
        'learn_post_likes' => ['scope' => 'user_id', 'write' => true],
        'expert_wishlists' => ['scope' => 'user_id', 'write' => true],
        'addresses' => ['scope' => 'user_id', 'write' => true],
        // Cart lives behind Modules/Checkout REST (/api/cart/*).
        'prescriptions' => ['scope' => 'user_id', 'write' => true],
        'health_tickets' => ['scope' => 'user_id', 'write' => true],
        'building_service_bookings' => ['scope' => 'user_id', 'write' => true],
        'medicine_orders' => ['scope' => 'user_id', 'write' => true],

        // user-scoped reads (writes go through module APIs)
        'bookings' => ['scope' => 'user_id', 'write' => false],
        'orders' => ['scope' => 'user_id', 'write' => false],
        'notifications' => ['scope' => 'user_id', 'write' => false],
        'tickets' => ['scope' => 'user_id', 'write' => false],

        // conversation participants
        'chat_conversations' => ['scope' => null, 'write' => false],
        'chat_messages' => ['scope' => null, 'write' => false],
        'ticket_messages' => ['scope' => null, 'write' => false],
        'learn_direct_messages' => ['scope' => null, 'write' => false],

        // shared catalog / public data — read-only
        'doctors' => ['scope' => null, 'write' => false],
        'departments' => ['scope' => null, 'write' => false],
        'courses' => ['scope' => null, 'write' => false],
        'course_lessons' => ['scope' => null, 'write' => false],
        'medicines' => ['scope' => null, 'write' => false],
        'need_categories' => ['scope' => null, 'write' => false],
        'need_items' => ['scope' => null, 'write' => false],
        'expert_availability' => ['scope' => null, 'write' => false],
        'expert_reviews' => ['scope' => null, 'write' => false],
        'vendor_orders' => ['scope' => null, 'write' => false],
        'medicine_order_items' => ['scope' => null, 'write' => false],
        'order_tracking' => ['scope' => null, 'write' => false],
        'service_workers' => ['scope' => null, 'write' => false],
        'health_content' => ['scope' => null, 'write' => false],
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
            ->except(['id', 'created_at', 'updated_at', 'deleted_at'])
            ->toArray();

        if ($payload === []) {
            return response()->json(['message' => 'No valid fields provided'], 422);
        }

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
            ->except(['id', 'created_at'])
            ->toArray();

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
     * @return array{scope: ?string}
     */
    private function resolveTable(string $table, bool $write = false): array
    {
        if (!array_key_exists($table, self::TABLES)) {
            abort(404, "Unknown resource '{$table}'.");
        }

        if ($write && !self::TABLES[$table]['write']) {
            abort(405, "Resource '{$table}' is read-only through the gateway.");
        }

        if (!Schema::hasTable($table)) {
            abort(404, "Resource '{$table}' is not available.");
        }

        return ['scope' => self::TABLES[$table]['scope']];
    }

    private function applyScope(Request $request, $query, string $table, ?string $scopeColumn): void
    {
        if (!$scopeColumn || !Schema::hasColumn($table, $scopeColumn)) {
            return;
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
