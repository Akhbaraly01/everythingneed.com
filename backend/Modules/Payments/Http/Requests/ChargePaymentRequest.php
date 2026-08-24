<?php

namespace Modules\Payments\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ChargePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'order_id' => 'nullable|uuid',
            'amount' => 'required|numeric|min:0.01',
            'currency' => 'nullable|string|size:3',
            'method' => 'required|string|max:50',
        ];
    }
}
