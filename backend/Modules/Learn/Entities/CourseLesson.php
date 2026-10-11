<?php

namespace Modules\Learn\Entities;

use App\Models\Model;

class CourseLesson extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'course_id',
        'title',
        'content',
        'video_url',
        'duration_minutes',
        'lesson_order',
        'resources',
        'is_free_preview',
    ];

    protected $casts = [
        'duration_minutes' => 'integer',
        'lesson_order' => 'integer',
        'resources' => 'array',
        'is_free_preview' => 'boolean',
    ];

    public function course()
    {
        return $this->belongsTo(Course::class);
    }
}
