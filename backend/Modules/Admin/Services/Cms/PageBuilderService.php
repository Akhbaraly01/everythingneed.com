<?php

namespace Modules\Admin\Services\Cms;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Modules\Admin\Entities\CmsBlock;
use Modules\Admin\Entities\CmsPage;
use Modules\Admin\Entities\CmsRevision;

/**
 * Page builder persistence (spec S41/S45/S71).
 *
 * - Block saves are schema-validated (BlockRegistry) and applied in one
 *   transaction together with a revision snapshot.
 * - Restore writes a NEW revision (history is never destroyed).
 * - Retention prunes only the oldest snapshots beyond config('cms.revision_retention').
 */
class PageBuilderService
{
    /** Page metadata columns captured in every snapshot. */
    private const PAGE_FIELDS = [
        'title', 'slug', 'status', 'content', 'description',
        'seo_title', 'seo_description', 'seo_image', 'canonical_url',
        'visibility', 'template', 'menu_placement',
    ];

    /**
     * Replace a page's blocks and append a revision.
     *
     * @param  array<int, mixed>  $blocks  raw payload (already shape-checked by the request)
     * @return array{revision: CmsRevision, blocks: array<int, CmsBlock>}
     */
    public function saveBlocks(CmsPage $page, array $blocks, ?string $note, ?string $userId): array
    {
        $clean = BlockRegistry::validateBlocks($blocks);

        return DB::transaction(function () use ($page, $clean, $note, $userId) {
            // Replacement removes the previous set outright: soft-deleted
            // block rows would otherwise pile up on every save.
            CmsBlock::where('page_id', $page->id)->forceDelete();

            $rows = [];
            foreach ($clean as $i => $block) {
                $rows[] = [
                    'id' => $block['id'] ?? (string) Str::uuid7(),
                    'page_id' => $page->id,
                    'type' => $block['type'],
                    'data' => json_encode($block['data'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                    'sort_order' => $i,
                    'is_visible' => $block['is_visible'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
            if ($rows !== []) {
                CmsBlock::insert($rows);
            }

            $page->touch();
            $revision = $this->appendRevision($page, $note, $userId);

            return [
                'revision' => $revision,
                'blocks' => CmsBlock::where('page_id', $page->id)->orderBy('sort_order')->get()->all(),
            ];
        });
    }

    /**
     * Restore an earlier snapshot by writing it forward as a NEW revision.
     */
    public function restore(CmsPage $page, int $version, ?string $userId): CmsRevision
    {
        $revision = CmsRevision::where('page_id', $page->id)
            ->where('version', $version)
            ->firstOrFail();

        $snapshot = $revision->snapshot;
        $pageData = $snapshot['page'] ?? [];
        $blocks = $snapshot['blocks'] ?? [];

        return DB::transaction(function () use ($page, $pageData, $blocks, $version, $userId) {
            $payload = ['updated_at' => now()];
            foreach (self::PAGE_FIELDS as $field) {
                if (array_key_exists($field, $pageData)) {
                    $payload[$field] = $pageData[$field];
                }
            }
            if (($pageData['status'] ?? null) === 'published' && empty($pageData['published_at'] ?? null)) {
                $payload['published_at'] = now();
            } elseif (array_key_exists('published_at', $pageData)) {
                $payload['published_at'] = $pageData['published_at'];
            }
            DB::table('cms_pages')->where('id', $page->id)->update($payload);
            $page->refresh();

            // Re-apply blocks from the snapshot (validated again - a snapshot
            // can never smuggle an unregistered block type back in).
            $clean = BlockRegistry::validateBlocks($blocks);
            CmsBlock::where('page_id', $page->id)->forceDelete();
            $rows = [];
            foreach ($clean as $i => $block) {
                $rows[] = [
                    'id' => (string) Str::uuid7(),
                    'page_id' => $page->id,
                    'type' => $block['type'],
                    'data' => json_encode($block['data'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                    'sort_order' => $i,
                    'is_visible' => $block['is_visible'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
            if ($rows !== []) {
                CmsBlock::insert($rows);
            }

            $page->touch();

            return $this->appendRevision($page, "Restored from v{$version}", $userId);
        });
    }

    /**
     * Snapshot the page's current metadata + blocks as the next version.
     * Called inside the caller's transaction.
     */
    public function appendRevision(CmsPage $page, ?string $note, ?string $userId): CmsRevision
    {
        $version = (int) CmsRevision::where('page_id', $page->id)->max('version') + 1;

        $pageRow = DB::table('cms_pages')->where('id', $page->id)->first();
        $pageData = [];
        foreach (array_merge(self::PAGE_FIELDS, ['published_at']) as $field) {
            $pageData[$field] = $pageRow->{$field} ?? null;
        }

        $blocks = CmsBlock::where('page_id', $page->id)
            ->orderBy('sort_order')
            ->get()
            ->map(fn (CmsBlock $b) => [
                'type' => $b->type,
                'data' => $b->data,
                'sort_order' => $b->sort_order,
                'is_visible' => $b->is_visible,
            ])
            ->values()
            ->all();

        $revision = CmsRevision::create([
            'page_id' => $page->id,
            'version' => $version,
            'snapshot' => ['page' => $pageData, 'blocks' => $blocks],
            'note' => $note,
            'created_by' => $userId,
        ]);

        $this->prune($page);

        return $revision;
    }

    /** Keep only the newest N snapshots (spec S45 retention policy). */
    public function prune(CmsPage $page): void
    {
        $keep = max(1, (int) config('cms.revision_retention', 50));

        $old = CmsRevision::where('page_id', $page->id)
            ->orderByDesc('version')
            ->skip($keep)
            ->take(1000)
            ->pluck('id');

        if ($old->isNotEmpty()) {
            // Retention is a real prune - rows beyond the window are gone.
            CmsRevision::whereIn('id', $old)->forceDelete();
        }
    }

    /** Current ordered block rows for a page. @return array<int, CmsBlock> */
    public function blocks(CmsPage $page): array
    {
        return CmsBlock::where('page_id', $page->id)
            ->orderBy('sort_order')
            ->get()
            ->all();
    }
}
