<?php

namespace Modules\Learn\Entities;

use App\Models\Model;
use Database\Factories\CourseFactory;
use Illuminate\Database\Eloquent\Factories\Factory;

class Course extends Model
{
    protected static function newFactory(): Factory
    {
        return CourseFactory::new();
    }

    protected $fillable = [
        'title',
        'slug',
        'description',
        'category',
        'course_type',
        'instructor_name',
        'price',
        'thumbnail_url',
        'video_url',
        'duration_hours',
        'students_count',
        'rating',
        'reviews_count',
        'is_featured',
        'level',
        'objectives',
        'requirements',
        'language',
        'status',
        'published_at',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'duration_hours' => 'decimal:1',
        'students_count' => 'integer',
        'rating' => 'decimal:1',
        'reviews_count' => 'integer',
        'is_featured' => 'boolean',
        'objectives' => 'array',
        'published_at' => 'datetime',
    ];

    public const STATUS_DRAFT = 'draft';
    public const STATUS_PUBLISHED = 'published';
    public const STATUS_ARCHIVED = 'archived';

    /** Public catalog scope: only published courses are discoverable. */
    public function scopePublished($query)
    {
        return $query->where('status', self::STATUS_PUBLISHED);
    }

    public function lessons()
    {
        return $this->hasMany(CourseLesson::class);
    }

    /** Course reviews live in the Reviews module; this is the read side. */
    public function reviews()
    {
        return $this->morphMany(\Modules\Reviews\Entities\Review::class, 'reviewable');
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }
}
