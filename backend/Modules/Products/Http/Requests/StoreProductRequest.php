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

        if ($user->hasRole('super_admin') || $user->hasRole('administrator')) {
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
            'description' => 'nullable|string|max:2000',
            'category' => 'required|string|max:100',
            'subcategory' => 'nullable|string|max:100',
            'price' => 'required|numeric|min:0',
            'compare_price' => 'nullable|numeric|min:0',
            'image_url' => 'nullable|url|max:500',
            'images' => 'nullable|array',
            'stock_quantity' => 'required|integer|min:0',
        ];
    }
}
