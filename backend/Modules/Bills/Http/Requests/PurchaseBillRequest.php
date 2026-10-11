<?php

namespace Modules\Bills\Http\Requests;

use Core\Support\Currencies;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PurchaseBillRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    /** W18 (F-03): normalize case before the whitelist check. */
    protected function prepareForValidation(): void
    {
        $code = Currencies::normalize($this->input('currency'));

        if ($code !== null) {
            $this->merge(['currency' => $code]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'service' => ['required', 'string', 'max:30'],
            'country' => ['required', 'string', 'size:2'],
            'currency' => ['required', 'string', 'size:3', Rule::in(Currencies::SUPPORTED)],
            'amount' => ['required', 'numeric', 'min:1'],
            'account_fields' => ['required', 'array'],
            'account_fields.*' => ['nullable', 'string', 'max:100'],
            'idempotency_key' => ['nullable', 'string', 'max:100'],
        ];
    }
}
