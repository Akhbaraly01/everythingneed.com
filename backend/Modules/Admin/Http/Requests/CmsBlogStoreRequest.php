<?php

namespace Modules\Admin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Rules\NoExecutableCode;

class CmsBlogStoreRequest extends FormRequest
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
            'content' => ['nullable', 'string', new NoExecutableCode()],
            'status' => 'nullable|in:draft,published',
        ];
    }
}
