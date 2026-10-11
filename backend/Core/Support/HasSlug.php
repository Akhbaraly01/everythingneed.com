<?php

namespace Core\Support;

use Illuminate\Support\Str;

/**
 * Canonical slug generation for spec §9 slug URLs (products, vendors, deals).
 *
 * A slug is generated once from the model's source value on first save and
 * stays stable afterwards so inbound links never break; collisions get a
 * numeric suffix. `slugSourceValue()` is overridable per model (vendors use
 * their store name).
 */
trait HasSlug
{
    public static function bootHasSlug(): void
    {
        static::saving(function ($model): void {
            if ($model->slug === null || $model->slug === '') {
                $model->slug = $model->generateUniqueSlug($model->slugSourceValue());
            }
        });
    }

    protected function slugSourceValue(): string
    {
        return (string) ($this->name ?? '');
    }

    protected function generateUniqueSlug(string $source): string
    {
        $base = Str::slug($source) ?: 'item';
        $slug = $base;
        $suffix = 2;

        while ($this->slugTaken($slug)) {
            $slug = $base . '-' . $suffix++;
        }

        return $slug;
    }

    private function slugTaken(string $slug): bool
    {
        $query = static::withoutGlobalScopes()->where('slug', $slug);

        if ($this->exists) {
            $query->where($this->getKeyName(), '!=', $this->getKey());
        }

        return $query->exists();
    }
}
