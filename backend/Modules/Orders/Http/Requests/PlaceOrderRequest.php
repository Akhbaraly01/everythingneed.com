<?php

namespace Modules\Orders\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PlaceOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'delivery_address' => 'required|string|max:500',
            'prescription_url' => 'nullable|url|max:500',
            'items' => 'required|array|min:1',
            'items.*.medicine_id' => 'required|uuid|exists:medicines,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'nullable|numeric|min:0',
        ];
    }
}
