<?php

namespace Modules\Products\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Modules\Vendors\Entities\Vendor;

class StoreProductRequest extends FormRequest
{
    private const UUID_PATTERN = '/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/';

    public function authorize(): bool
    {
        $user = $this->user();

        if (!$user) {
            return false;
        }

        if ($user->hasRole('super_admin') || $user->hasRole('administrator') || $user->hasRole('platform_ops')) {
            return true;
        }

        if ($user->hasPermission('products.products.manage')) {
            return true;
        }

        $vendorId = $this->input('vendor_id');

        // Missing value is a validation concern (422); ownership/format is authorization (403)
        if ($vendorId === null || $vendorId === '') {
            return true;
        }

        if (!is_string($vendorId) || !preg_match(self::UUID_PATTERN, $vendorId)) {
            return false;
        }

        $vendor = Vendor::withTrashed()->find($vendorId);

        return $vendor !== null && $vendor->user_id === $user->id;
    }

    public function rules(): array
    {
        return [
            'vendor_id' => 'required|uuid|exists:vendors,id',
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:160|unique:products,slug',
            'description' => 'nullable|string|max:2000',
            'category' => 'required|string|max:100',
            'subcategory' => 'nullable|string|max:100',
            'sku' => 'nullable|string|max:64',
            'price' => 'required|numeric|min:0',
            'compare_price' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|size:3',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'discount_percent' => 'nullable|numeric|min:0|max:100',
            'featured' => 'nullable|boolean',
            'publication_state' => 'nullable|string|in:draft,published,hidden,archived',
            'specifications' => 'nullable|array',
            'attributes' => 'nullable|array',
            'shipping' => 'nullable|array',
            'image_url' => 'nullable|url|max:500',
            'images' => 'nullable|array',
            'video_url' => 'nullable|url|max:500',
            'production_video_url' => 'nullable|url|max:500',
            'stock_quantity' => 'required|integer|min:0',
            // Spec 37 variants: managed alongside the product (product_variants).
            'variants' => 'nullable|array',
            'variants.*.name' => 'required|string|max:120',
            'variants.*.sku' => 'nullable|string|max:64',
            'variants.*.price' => 'required|numeric|min:0',
            'variants.*.stock_quantity' => 'nullable|integer|min:0',
            'variants.*.attributes' => 'nullable|array',
            'variants.*.is_active' => 'nullable|boolean',
        ];
    }
}
