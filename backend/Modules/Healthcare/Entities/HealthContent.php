<?php

namespace Modules\Healthcare\Entities;

use App\Models\Model;

class HealthContent extends Model
{
    protected $table = 'health_content';

    public const TYPE_VIDEO = 'video';
    public const TYPE_DOCUMENT = 'document';
    public const TYPE_CATEGORY = 'category';
    public const TYPE_PREVENTION_GUIDE = 'prevention_guide';

    protected $fillable = [
        'type',
        'title',
        'slug',
        'summary',
        'body',
        'url',
        'thumbnail_url',
        'specialty',
        'duration_minutes',
        'is_active',
    ];

    protected $casts = [
        'duration_minutes' => 'integer',
        'is_active' => 'boolean',
    ];

    public function scopeType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
