<?php

namespace Modules\Learn\Entities;

use App\Models\Model;

class Course extends Model
{
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
        'is_featured',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'duration_hours' => 'decimal:1',
        'students_count' => 'integer',
        'rating' => 'decimal:1',
        'is_featured' => 'boolean',
    ];

    public function lessons()
    {
        return $this->hasMany(CourseLesson::class);
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }
}
