<?php

namespace Modules\Admin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Modules\Admin\Services\Cms\BlockRegistry;

class CmsBannerUpdateRequest extends FormRequest
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
            'title' => 'sometimes|string|max:255',
            'position' => 'sometimes|string|max:100',
            'image_url' => array_merge(['sometimes'], BlockRegistry::safeUrlRule()),
            'link_url' => array_merge(['sometimes'], BlockRegistry::safeUrlRule()),
            'sort_order' => 'sometimes|integer|min:0|max:9999',
            'is_active' => 'sometimes|boolean',
        ];
    }
}
