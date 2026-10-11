<?php

namespace Modules\Orders\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PlaceProductOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Route middleware (auth/sanctum + gates) is the guard;
        // this request class owns payload validation only.
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|uuid',
            'items.*.variant_id' => 'nullable|uuid',
            'items.*.quantity' => 'required|integer|min:1|max:1000',
            'coupon_code' => 'nullable|string|max:50',
            'shipping_address' => 'required|string|max:1000',
            'shipping_city' => 'nullable|string|max:255',
            'shipping_country' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:30',
            'notes' => 'nullable|string|max:2000',
            'idempotency_key' => 'nullable|string|max:100',
        ];
    }
}
