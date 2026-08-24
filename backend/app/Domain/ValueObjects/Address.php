<?php

namespace App\Domain\ValueObjects;

class Address
{
    public function __construct(
        private readonly string $street,
        private readonly string $city,
        private readonly string $state,
        private readonly string $zipCode,
        private readonly string $country,
        private readonly ?Coordinates $coordinates = null,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            street: $data['street'] ?? '',
            city: $data['city'] ?? '',
            state: $data['state'] ?? '',
            zipCode: $data['zip_code'] ?? '',
            country: $data['country'] ?? '',
            coordinates: isset($data['lat'], $data['lng'])
                ? Coordinates::from((float) $data['lat'], (float) $data['lng'])
                : null,
        );
    }

    public function street(): string { return $this->street; }
    public function city(): string { return $this->city; }
    public function state(): string { return $this->state; }
    public function zipCode(): string { return $this->zipCode; }
    public function country(): string { return $this->country; }
    public function coordinates(): ?Coordinates { return $this->coordinates; }

    public function fullAddress(): string
    {
        return "{$this->street}, {$this->city}, {$this->state} {$this->zipCode}, {$this->country}";
    }

    public function toArray(): array
    {
        return [
            'street' => $this->street,
            'city' => $this->city,
            'state' => $this->state,
            'zip_code' => $this->zipCode,
            'country' => $this->country,
            'lat' => $this->coordinates?->lat(),
            'lng' => $this->coordinates?->lng(),
        ];
    }

    public function equals(self $other): bool
    {
        return $this->fullAddress() === $other->fullAddress();
    }
}
