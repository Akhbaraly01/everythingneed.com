<?php

namespace Modules\Learn\Entities;

use App\Models\Model;

class VideoProgress extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'course_id',
        'lesson_id',
        'last_position_seconds',
        'watch_time_seconds',
        'progress_percent',
        'completed',
    ];

    protected $casts = [
        'last_position_seconds' => 'integer',
        'watch_time_seconds' => 'integer',
        'progress_percent' => 'integer',
        'completed' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function lesson()
    {
        return $this->belongsTo(CourseLesson::class, 'lesson_id');
    }
}
