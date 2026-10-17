<?php

namespace Modules\Admin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class HomeSectionStoreRequest extends FormRequest
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
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:100|unique:home_page_sections,slug|regex:/^[a-z0-9\-]+$/',
            'is_active' => 'nullable|boolean',
            'order' => 'nullable|integer|min:0|max:9999',
        ];
    }
}
