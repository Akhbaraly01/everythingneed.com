<?php

namespace Modules\Admin\Http\Requests\Concerns;

use Modules\Admin\Services\Cms\BlockRegistry;

/**
 * Page-builder metadata rules shared by the CMS page store/update
 * requests (spec S41: slug, description, SEO, visibility, template,
 * menu placement).
 */
trait HasCmsPageBuilderRules
{
    /** @return array<string, mixed> */
    protected function pageBuilderRules(): array
    {
        return [
            'slug' => 'sometimes|nullable|string|max:120|regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
            'description' => 'sometimes|nullable|string|max:5000',
            'seo_title' => 'sometimes|nullable|string|max:255',
            'seo_description' => 'sometimes|nullable|string|max:320',
            'seo_image' => array_merge(['sometimes'], BlockRegistry::safeUrlRule()),
            'canonical_url' => array_merge(['sometimes'], BlockRegistry::safeUrlRule()),
            'visibility' => 'sometimes|nullable|in:public,unlisted',
            'template' => 'sometimes|nullable|string|max:40|regex:/^[a-z0-9\-]+$/',
            'menu_placement' => 'sometimes|nullable|in:none,header,footer,both',
        ];
    }
}
