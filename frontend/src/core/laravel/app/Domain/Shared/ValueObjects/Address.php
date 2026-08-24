<?php

namespace App\Domain\Shared\ValueObjects;

class Address
{
    public function __construct(
        private string $street,
        private string $city,
        private string $state,
        private string $zipCode,
        private string $country,
        private ?float $lat = null,
        private ?float $lng = null
    ) {}

    public function street(): string
    {
        return $this->street;
    }

    public function city(): string
    {
        return $this->city;
    }

    public function state(): string
    {
        return $this->state;
    }

    public function zipCode(): string
    {
        return $this->zipCode;
    }

    public function country(): string
    {
        return $this->country;
    }

    public function lat(): ?float
    {
        return $this->lat;
    }

    public function lng(): ?float
    {
        return $this->lng;
    }

    public function hasCoordinates(): bool
    {
        return $this->lat !== null && $this->lng !== null;
    }

    public function equals(Address $other): bool
    {
        return $this->street === $other->street() &&
               $this->city === $other->city() &&
               $this->state === $other->state() &&
               $this->zipCode === $other->zipCode() &&
               $this->country === $other->country();
    }

    public function toArray(): array
    {
        return [
            'street' => $this->street,
            'city' => $this->city,
            'state' => $this->state,
            'zip_code' => $this->zipCode,
            'country' => $this->country,
            'lat' => $this->lat,
            'lng' => $this->lng,
        ];
    }

    public function __toString(): string
    {
        return sprintf('%s, %s, %s %s, %s', $this->street, $this->city, $this->state, $this->zipCode, $this->country);
    }
}
