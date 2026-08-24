<?php

namespace Core\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

abstract class BaseFactory extends Factory
{
    protected function snakeAttributes(array $attributes): array
    {
        return array_combine(
            array_map(fn($key) => Str::snake($key), array_keys($attributes)),
            array_values($attributes)
        );
    }
}
