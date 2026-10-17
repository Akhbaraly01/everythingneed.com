<?php

namespace Modules\Admin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class HomeSectionUpdateRequest extends FormRequest
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
        $id = $this->route('id');

        return [
            'name' => 'sometimes|required|string|max:255',
            'slug' => [
                'sometimes', 'required', 'string', 'max:100', 'regex:/^[a-z0-9\-]+$/',
                Rule::unique('home_page_sections', 'slug')->ignore($id),
            ],
            'is_active' => 'sometimes|required|boolean',
            'order' => 'sometimes|required|integer|min:0|max:9999',
        ];
    }
}
