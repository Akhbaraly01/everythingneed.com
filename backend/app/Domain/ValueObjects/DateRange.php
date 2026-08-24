<?php

namespace App\Domain\ValueObjects;

use Illuminate\Support\Carbon;

class DateRange
{
    public function __construct(
        private readonly Carbon $start,
        private readonly Carbon $end,
    ) {
        if ($this->end->lessThan($this->start)) {
            throw new \InvalidArgumentException('End date must be after start date');
        }
    }

    public static function create(string $start, string $end): self
    {
        return new self(Carbon::parse($start), Carbon::parse($end));
    }

    public function start(): Carbon { return $this->start; }
    public function end(): Carbon { return $this->end; }

    public function durationInDays(): int
    {
        return $this->start->diffInDays($this->end) + 1;
    }

    public function contains(Carbon $date): bool
    {
        return $date->between($this->start, $this->end);
    }

    public function overlaps(self $other): bool
    {
        return $this->start->lessThan($other->end) && $this->end->greaterThan($other->start);
    }

    public function toArray(): array
    {
        return ['start' => $this->start->toDateString(), 'end' => $this->end->toDateString()];
    }
}
