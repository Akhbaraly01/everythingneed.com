<?php

namespace Modules\Products\Listeners;

use Modules\Products\Events\ProductCreated;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class IndexProductForSearch implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(ProductCreated $event): void
    {
        // Index product in search engine (Algolia, Meilisearch, etc.)
    }
}
