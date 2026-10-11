<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Admin\Entities\CmsPage;
use Modules\Admin\Entities\CmsRevision;
use Modules\Admin\Services\Cms\BlockRegistry;
use Modules\Admin\Services\Cms\PageBuilderService;

/**
 * No-code page builder API (spec S40-S45, S68, S99).
 *
 * Route-level authorization combines the manageCms role gate with the
 * granular cms.blocks.* and cms.revisions.* permissions (PermissionSeeder).
 */
class AdminPageBuilderController extends Controller
{
    public function __construct(private PageBuilderService $builder) {}

    /** GET /api/admin/cms/blocks/registry - the closed 24-type registry. */
    public function registry(): JsonResponse
    {
        return response()->json([
            'data' => array_values(BlockRegistry::catalog()),
            'types' => BlockRegistry::types(),
        ]);
    }

    /** GET /api/admin/cms/pages/{id}/blocks - current ordered block rows. */
    public function blocks(string $id): JsonResponse
    {
        $page = $this->findPage($id);

        return response()->json([
            'data' => $this->builder->blocks($page),
            'page' => $page,
        ]);
    }

    /** PUT /api/admin/cms/pages/{id}/blocks - validate + save + revision. */
    public function saveBlocks(Request $request, string $id): JsonResponse
    {
        $page = $this->findPage($id);

        $payload = $request->validate([
            'blocks' => 'required|array',
            'blocks.*' => 'array',
            'blocks.*.type' => 'required|string',
            'blocks.*.data' => 'required|array',
            'blocks.*.is_visible' => 'sometimes|boolean',
            'note' => 'nullable|string|max:255',
        ]);

        $result = $this->builder->saveBlocks(
            $page,
            $payload['blocks'],
            $payload['note'] ?? null,
            $request->user()?->id,
        );

        $this->forgetPageCache($page->slug);

        return response()->json([
            'message' => 'Blocks saved',
            'data' => [
                'page' => $page->fresh(),
                'blocks' => $result['blocks'],
                'revision' => [
                    'version' => $result['revision']->version,
                    'note' => $result['revision']->note,
                    'created_at' => $result['revision']->created_at,
                ],
            ],
        ]);
    }

    /** GET /api/admin/cms/pages/{id}/revisions - snapshot history. */
    public function revisions(string $id): JsonResponse
    {
        $page = $this->findPage($id);

        $rows = CmsRevision::where('page_id', $page->id)
            ->orderByDesc('version')
            ->get()
            ->map(function (CmsRevision $r) {
                $snapshot = $r->snapshot;
                $author = $r->createdBy;

                return [
                    'version' => $r->version,
                    'note' => $r->note,
                    'blocks' => count($snapshot['blocks'] ?? []),
                    'status' => $snapshot['page']['status'] ?? null,
                    'author' => $author?->name,
                    'created_at' => $r->created_at,
                ];
            });

        return response()->json(['data' => $rows]);
    }

    /** GET /api/admin/cms/pages/{id}/revisions/{version} - one snapshot. */
    public function revision(string $id, int $version): JsonResponse
    {
        $page = $this->findPage($id);

        $revision = CmsRevision::where('page_id', $page->id)
            ->where('version', $version)
            ->firstOrFail();

        return response()->json([
            'data' => [
                'version' => $revision->version,
                'note' => $revision->note,
                'created_at' => $revision->created_at,
                'snapshot' => $revision->snapshot,
            ],
        ]);
    }

    /** POST /api/admin/cms/pages/{id}/revisions/{version}/restore - write-forward. */
    public function restore(Request $request, string $id, int $version): JsonResponse
    {
        $page = $this->findPage($id);

        $revision = $this->builder->restore($page, $version, $request->user()?->id);

        $this->forgetPageCache($page->slug);

        return response()->json([
            'message' => "Restored as revision {$revision->version}",
            'data' => [
                'page' => $page->fresh(),
                'blocks' => $this->builder->blocks($page),
                'revision' => [
                    'version' => $revision->version,
                    'note' => $revision->note,
                    'created_at' => $revision->created_at,
                ],
            ],
        ]);
    }

    private function findPage(string $id): CmsPage
    {
        $page = CmsPage::find($id);
        abort_unless($page !== null, 404, 'Page not found');

        return $page;
    }

    private function forgetPageCache(string $slug): void
    {
        \Illuminate\Support\Facades\Cache::forget("cms.page.{$slug}");
    }
}
