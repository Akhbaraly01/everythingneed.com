<?php

namespace Modules\Learn\Entities;

use App\Models\Model;

class LessonNote extends Model
{
    protected $fillable = [
        'user_id',
        'lesson_id',
        'course_id',
        'body',
    ];

    public function lesson()
    {
        return $this->belongsTo(CourseLesson::class, 'lesson_id');
    }
}
