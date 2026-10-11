<?php

namespace Modules\Admin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Rules\NoExecutableCode;

class CmsAnnouncementUpdateRequest extends FormRequest
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
            'priority' => 'sometimes|in:low,medium,high',
            'starts_at' => 'sometimes|nullable|date',
            'ends_at' => 'sometimes|nullable|date|after_or_equal:starts_at',
            'is_active' => 'sometimes|boolean',
        ];
    }
}
