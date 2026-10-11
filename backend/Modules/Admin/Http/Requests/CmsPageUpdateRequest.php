<?php

namespace Modules\Admin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Rules\NoExecutableCode;
use Modules\Admin\Http\Requests\Concerns\HasCmsPageBuilderRules;

class CmsPageUpdateRequest extends FormRequest
{
    use HasCmsPageBuilderRules;

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return array_merge([
            'title' => 'sometimes|string|max:255',
            'content' => ['sometimes', 'nullable', 'string', new NoExecutableCode()],
            'status' => 'sometimes|in:draft,published',
        ], $this->pageBuilderRules());
    }
}
