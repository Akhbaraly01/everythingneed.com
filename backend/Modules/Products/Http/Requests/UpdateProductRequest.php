<?php

namespace Modules\Products\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:2000',
            'category' => 'sometimes|string|max:100',
            'subcategory' => 'nullable|string|max:100',
            'price' => 'sometimes|numeric|min:0',
            'compare_price' => 'nullable|numeric|min:0',
            'image_url' => 'nullable|url|max:500',
            'images' => 'nullable|array',
            'stock_quantity' => 'sometimes|integer|min:0',
            'is_active' => 'sometimes|boolean',
        ];
    }
}
