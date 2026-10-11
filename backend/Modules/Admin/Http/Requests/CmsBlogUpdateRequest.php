<?php

namespace Modules\Admin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Rules\NoExecutableCode;

class CmsBlogUpdateRequest extends FormRequest
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
            'content' => ['sometimes', 'nullable', 'string', new NoExecutableCode()],
            'status' => 'sometimes|in:draft,published',
        ];
    }
}
