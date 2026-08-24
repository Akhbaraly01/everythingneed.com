<?php

namespace App\Domain\ValueObjects;

class TimeSlot
{
    public function __construct(
        private readonly string $startTime,
        private readonly string $endTime,
    ) {
        if (!preg_match('/^\d{2}:\d{2}$/', $startTime) || !preg_match('/^\d{2}:\d{2}$/', $endTime)) {
            throw new \InvalidArgumentException('Time must be in HH:MM format');
        }
        if ($startTime >= $endTime) {
            throw new \InvalidArgumentException('End time must be after start time');
        }
    }

    public static function from(string $startTime, string $endTime): self
    {
        return new self($startTime, $endTime);
    }

    public function startTime(): string { return $this->startTime; }
    public function endTime(): string { return $this->endTime; }

    public function durationInMinutes(): int
    {
        [$startH, $startM] = explode(':', $this->startTime);
        [$endH, $endM] = explode(':', $this->endTime);
        return ($endH * 60 + $endM) - ($startH * 60 + $startM);
    }

    public function overlaps(self $other): bool
    {
        return $this->startTime < $other->endTime && $this->endTime > $other->startTime;
    }

    public function toArray(): array
    {
        return ['start_time' => $this->startTime, 'end_time' => $this->endTime];
    }
}
