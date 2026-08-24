<?php

namespace Core\DTOs;

abstract class BaseDTO
{
    public function __construct(array $data = [])
    {
        foreach ($data as $key => $value) {
            if (property_exists($this, $key)) {
                $this->{$key} = $value;
            }
        }
    }

    public static function from(array $data): static
    {
        return new static($data);
    }

    public function toArray(): array
    {
        $data = [];
        foreach (get_object_vars($this) as $key => $value) {
            $data[$key] = $value instanceof self ? $value->toArray() : $value;
        }
        return $data;
    }

    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
