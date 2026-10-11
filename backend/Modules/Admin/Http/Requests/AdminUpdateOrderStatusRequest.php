<?php

namespace Modules\Admin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Admin\Http\Controllers\AdminOrderController;

class AdminUpdateOrderStatusRequest extends FormRequest
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
            'status' => ['required', 'string', Rule::in(AdminOrderController::VALID_STATUSES)],
            'reason' => ['nullable', 'string', 'max:500'],
        ];
    }
}
