<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Modules\Admin\Entities\DynamicModule;
use Modules\Admin\Entities\DynamicModuleEntry;
use Modules\Admin\Http\Requests\StoreDynamicModuleRequest;
use Modules\Admin\Http\Requests\StoreModuleEntryRequest;
use Modules\Admin\Http\Requests\UpdateDynamicModuleRequest;
use Modules\Admin\Http\Requests\UpdateModuleEntryRequest;

/**
 * No-code dynamic modules (W3): admins declare field schemas; entries are
 * validated against them (unknown keys stripped, required + types
 * enforced). Published modules are readable publicly for storefront
 * content (FAQs, link lists); everything else needs modules.view/manage.
 *
 * NOTE: dynamic_module_entries has no timestamps/deleted_at columns, so
 * entry deletion is a hard forceDelete while modules soft-delete.
 */
class AdminDynamicModuleController extends Controller
{
    /** GET /api/admin/modules */
    public function index(): JsonResponse
    {
        $modules = DynamicModule::query()
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'icon', 'status', 'created_at'])
            ->map(fn ($m) => [
                'id' => $m->id,
                'name' => $m->name,
                'slug' => $m->slug,
                'icon' => $m->icon,
                'status' => $m->status,
                'entries_count' => DynamicModuleEntry::where('module_id', $m->id)->count(),
            ]);

        return response()->json(['data' => $modules]);
    }

    /** POST /api/admin/modules */
    public function store(StoreDynamicModuleRequest $request): JsonResponse
    {
        $v = $request->validated();

        $module = DynamicModule::create([
            'name' => $v['name'],
            'slug' => $v['slug'],
            'icon' => $v['icon'] ?? null,
            'status' => $v['status'] ?? 'draft',
            'fields' => array_values($v['fields']),
            'list_config' => $v['list_config'] ?? null,
            'requires_approval' => $v['requires_approval'] ?? false,
            'approval_roles' => $v['approval_roles'] ?? null,
            'created_by' => $request->user()->id,
        ]);

        return response()->json(['data' => $module], 201);
    }

    /** GET /api/admin/modules/{id} */
    public function show(string $id): JsonResponse
    {
        return response()->json(['data' => $this->moduleOrFail($id)]);
    }

    /** PUT /api/admin/modules/{id} */
    public function update(UpdateDynamicModuleRequest $request, string $id): JsonResponse
    {
        $module = $this->moduleOrFail($id);
        $v = $request->validated();

        // Shrinking the schema must not silently orphan entry data: refuse
        // to drop a field key that published entries still use.
        if (array_key_exists('fields', $v)) {
            $this->assertNoOrphanedKeys($module, array_column($v['fields'], 'key'));
            $v['fields'] = array_values($v['fields']);
        }

        $module->update($v);

        return response()->json(['data' => $module->fresh()]);
    }

    /** DELETE /api/admin/modules/{id} */
    public function destroy(string $id): JsonResponse
    {
        $module = $this->moduleOrFail($id);

        DynamicModuleEntry::where('module_id', $module->id)->forceDelete();
        $module->delete();

        return response()->json(['message' => 'Module deleted']);
    }

    /** GET /api/admin/modules/{id}/entries */
    public function entries(string $id): JsonResponse
    {
        $module = $this->moduleOrFail($id);

        return response()->json(['data' => DynamicModuleEntry::where('module_id', $module->id)
            ->orderBy('id')
            ->get(['id', 'module_id', 'slug', 'data', 'status'])]);
    }

    /** POST /api/admin/modules/{id}/entries */
    public function storeEntry(StoreModuleEntryRequest $request, string $id): JsonResponse
    {
        $module = $this->moduleOrFail($id);
        $v = $request->validated();

        // Moderated modules: published-intent entries stay draft and open
        // an approval request; plain drafts need no review.
        $wantsPublish = ($v['status'] ?? 'draft') === 'published';
        $status = ($wantsPublish && $module->requires_approval) ? 'draft' : ($v['status'] ?? 'draft');

        $entry = DynamicModuleEntry::create([
            'module_id' => $module->id,
            'slug' => $v['slug'] ?? null,
            'status' => $status,
            'data' => $this->cleanData($module, $v['data']),
            'created_by' => $request->user()->id,
        ]);

        $approvalId = null;
        if ($wantsPublish && $module->requires_approval) {
            $approval = app(\Core\Services\Contracts\ApprovalEngineInterface::class)->request(
                'dynamic_entry',
                "Review {$module->name} entry",
                $module->approval_roles ?? ['content_manager'],
                'dynamic_module_entry',
                (string) $entry->id,
                ['module_id' => $module->id, 'module_slug' => $module->slug],
                (string) $request->user()->id,
            );
            $approvalId = $approval->id;
        }

        return response()->json(['data' => $entry, 'approval_request_id' => $approvalId], 201);
    }

    /** PUT /api/admin/modules/{id}/entries/{entryId} */
    public function updateEntry(UpdateModuleEntryRequest $request, string $id, string $entryId): JsonResponse
    {
        $module = $this->moduleOrFail($id);
        $entry = $this->entryOrFail($module, $entryId);
        $v = $request->validated();

        $patch = [];
        if (array_key_exists('slug', $v)) {
            $patch['slug'] = $v['slug'];
        }
        if (array_key_exists('status', $v)) {
            $patch['status'] = $v['status'];
        }
        if (array_key_exists('data', $v)) {
            $merged = array_merge($entry->data ?? [], $v['data']);
            $patch['data'] = $this->cleanData($module, $merged);
        }

        if ($patch !== []) {
            $entry->forceFill($patch)->save();
        }

        return response()->json(['data' => $entry->fresh()]);
    }

    /** DELETE /api/admin/modules/{id}/entries/{entryId} */
    public function destroyEntry(string $id, string $entryId): JsonResponse
    {
        $module = $this->moduleOrFail($id);
        $this->entryOrFail($module, $entryId)->forceDelete();

        return response()->json(['message' => 'Entry deleted']);
    }

    /** GET /api/modules/{slug} - public, published only. */
    public function publicShow(string $slug): JsonResponse
    {
        $module = DynamicModule::where('slug', $slug)->where('status', 'published')->first();
        abort_unless($module !== null, 404);

        return response()->json(['data' => [
            'name' => $module->name,
            'slug' => $module->slug,
            'icon' => $module->icon,
            'fields' => $module->fields,
        ]]);
    }

    /** GET /api/modules/{slug}/entries - public, published only. */
    public function publicEntries(string $slug): JsonResponse
    {
        $module = DynamicModule::where('slug', $slug)->where('status', 'published')->first();
        abort_unless($module !== null, 404);

        $entries = DynamicModuleEntry::where('module_id', $module->id)
            ->where('status', 'published')
            ->orderBy('id')
            ->get(['id', 'slug', 'data']);

        return response()->json(['data' => $entries]);
    }

    // ── internals ────────────────────────────────────────────────

    private function moduleOrFail(string $id): DynamicModule
    {
        $module = DynamicModule::find($id);
        abort_unless($module !== null, 404, 'Module not found');

        return $module;
    }

    private function entryOrFail(DynamicModule $module, string $entryId): DynamicModuleEntry
    {
        $entry = DynamicModuleEntry::where('module_id', $module->id)->where('id', $entryId)->first();
        abort_unless($entry !== null, 404, 'Entry not found');

        return $entry;
    }

    private function assertNoOrphanedKeys(DynamicModule $module, array $newKeys): void
    {
        $used = DynamicModuleEntry::where('module_id', $module->id)->pluck('data')->all();
        foreach ($used as $data) {
            foreach (array_keys((array) $data) as $key) {
                if (! in_array($key, $newKeys, true)) {
                    throw ValidationException::withMessages([
                        'fields' => ["Field '{$key}' is still used by entries and cannot be dropped."],
                    ]);
                }
            }
        }
    }

    /**
     * Validate entry data against the module schema. Unknown keys are
     * stripped; required keys must be present (blank strings fail, false
     * and 0 pass); values are type-checked and lightly normalized.
     */
    private function cleanData(DynamicModule $module, array $data): array
    {
        $clean = [];
        $errors = [];

        foreach ($module->fields ?? [] as $field) {
            $key = $field['key'];
            $type = $field['type'];
            $required = (bool) ($field['required'] ?? false);

            if (! array_key_exists($key, $data)) {
                if ($required) {
                    $errors[$key] = ["The {$key} field is required."];
                }
                continue;
            }

            $value = $data[$key];
            $checked = $this->checkType($key, $type, $value, $required);

            if ($checked['error'] !== null) {
                $errors[$key] = [$checked['error']];
                continue;
            }

            $clean[$key] = $checked['value'];
        }

        if ($errors !== []) {
            throw ValidationException::withMessages(['data' => $errors]);
        }

        return $clean;
    }

    /**
     * @return array{error: ?string, value: mixed}
     */
    private function checkType(string $key, string $type, mixed $value, bool $required): array
    {
        if ($value === null || $value === '') {
            return $required
                ? ['error' => "The {$key} field is required.", 'value' => null]
                : ['error' => null, 'value' => $value];
        }

        return match ($type) {
            'number' => is_numeric($value)
                ? ['error' => null, 'value' => $value + 0]
                : ['error' => "The {$key} field must be a number.", 'value' => null],
            'boolean' => is_bool($value) || in_array($value, [0, 1, '0', '1'], true)
                ? ['error' => null, 'value' => (bool) $value]
                : ['error' => "The {$key} field must be true or false.", 'value' => null],
            'date' => is_string($value) && strtotime($value) !== false
                ? ['error' => null, 'value' => $value]
                : ['error' => "The {$key} field must be a valid date.", 'value' => null],
            default => is_string($value) || is_numeric($value)
                ? ['error' => null, 'value' => (string) $value]
                : ['error' => "The {$key} field must be text.", 'value' => null],
        };
    }
}
