<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Modules\Admin\Entities\CmsPage;
use Modules\Admin\Services\Cms\PageBuilderService;

/**
 * Spec §111 — CMS revision cleanup. Retention window comes from
 * config('cms.revision_retention'); every page keeps at least one snapshot.
 */
class PruneCmsRevisions extends Command
{
    protected $signature = 'cms:prune-revisions';

    protected $description = 'Prune CMS revisions beyond the retention window';

    public function handle(PageBuilderService $builder): int
    {
        $pages = 0;
        $deleted = 0;

        CmsPage::query()->select('id')->chunkById(100, function ($chunk) use ($builder, &$pages, &$deleted): void {
            foreach ($chunk as $row) {
                $before = \Modules\Admin\Entities\CmsRevision::where('page_id', $row->id)->count();
                $builder->prune($row);
                $after = \Modules\Admin\Entities\CmsRevision::where('page_id', $row->id)->count();
                $pages++;
                $deleted += max(0, $before - $after);
            }
        });

        $this->info("Pruned {$deleted} revision(s) across {$pages} page(s).");

        return self::SUCCESS;
    }
}
