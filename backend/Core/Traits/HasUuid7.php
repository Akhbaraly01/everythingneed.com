<?php

namespace Core\Traits;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * Time-ordered UUIDv7 primary keys (spec S70). UUIDv7 keeps inserts
 * index-friendly at platform scale, unlike random v4.
 */
trait HasUuid7
{
    public static function bootHasUuid7(): void
    {
        static::creating(function (Model $model) {
            if (empty($model->getKeyName()) || $model->{$model->getKeyName()} === null) {
                $model->{$model->getKeyName()} = Str::uuid7()->toString();
            }
        });
    }

    public function getIncrementing(): bool
    {
        return false;
    }

    public function getKeyType(): string
    {
        return 'string';
    }
}
