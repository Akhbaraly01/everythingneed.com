<?php

namespace Modules\Admin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Modules\Admin\Services\Cms\BlockRegistry;

class CmsBannerStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'position' => 'nullable|string|max:100',
            'image_url' => BlockRegistry::safeUrlRule(),
            'link_url' => BlockRegistry::safeUrlRule(),
            'sort_order' => 'nullable|integer|min:0|max:9999',
            'is_active' => 'nullable|boolean',
        ];
    }
}
