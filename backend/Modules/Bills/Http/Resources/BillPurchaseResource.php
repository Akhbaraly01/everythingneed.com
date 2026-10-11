<?php

namespace Modules\Bills\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class BillPurchaseResource extends JsonResource
{
    /**
     * Spec 30 + privacy: account identifiers (phones, meters, smartcards)
     * are masked — receipts need the last digits, not the full number.
     */
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'service' => $this->service,
            'country' => $this->country,
            'currency' => $this->currency,
            'amount' => $this->amount,
            'status' => $this->status,
            'reference' => $this->reference,
            'account_masked' => self::maskAccount((array) ($this->account_fields ?? [])),
            'provider' => $this->provider,
            'provider_reference' => $this->provider_reference,
            'wallet_refunded' => (bool) $this->wallet_refunded,
            'created_at' => $this->created_at,
        ];
    }

    public static function maskAccount(array $fields): array
    {
        $masked = [];
        foreach ($fields as $key => $value) {
            $value = (string) $value;
            $masked[$key] = strlen($value) > 4 ? '****'.substr($value, -4) : '****';
        }

        return $masked;
    }
}
