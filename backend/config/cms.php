<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Revision retention (spec S45)
    |--------------------------------------------------------------------------
    | Number of newest page revisions kept per page. Older snapshots are
    | pruned on save; restoration always writes a NEW revision so history
    | is never destroyed by a restore.
    */
    'revision_retention' => (int) env('CMS_REVISION_RETENTION', 50),

    /*
    |--------------------------------------------------------------------------
    | Public page cache TTL (spec S109)
    |--------------------------------------------------------------------------
    | Published CMS page structure (blocks) is cached per slug+updated_at;
    | dynamic block items are always resolved fresh so listings never go
    | stale. Seconds.
    */
    'page_cache_ttl' => (int) env('CMS_PAGE_CACHE_TTL', 900),

];
