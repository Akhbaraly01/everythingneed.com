<?php

namespace App\Domain\ValueObjects;

class Coordinates
{
    public function __construct(
        private readonly float $lat,
        private readonly float $lng,
    ) {
        if ($lat < -90 || $lat > 90) {
            throw new \InvalidArgumentException("Invalid latitude: {$lat}");
        }
        if ($lng < -180 || $lng > 180) {
            throw new \InvalidArgumentException("Invalid longitude: {$lng}");
        }
    }

    public static function from(float $lat, float $lng): self
    {
        return new self($lat, $lng);
    }

    public function lat(): float { return $this->lat; }
    public function lng(): float { return $this->lng; }

    public function toArray(): array
    {
        return ['lat' => $this->lat, 'lng' => $this->lng];
    }

    public function distanceTo(self $other): float
    {
        $earthRadius = 6371000;
        $dLat = deg2rad($other->lat - $this->lat);
        $dLng = deg2rad($other->lng - $this->lng);
        $a = sin($dLat / 2) ** 2 + cos(deg2rad($this->lat)) * cos(deg2rad($other->lat)) * sin($dLng / 2) ** 2;
        return $earthRadius * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }

    public function equals(self $other): bool
    {
        return abs($this->lat - $other->lat) < 0.000001 && abs($this->lng - $other->lng) < 0.000001;
    }
}
