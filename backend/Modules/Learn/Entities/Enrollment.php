<?php

namespace Modules\Learn\Entities;

use App\Models\Model;

class Enrollment extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'course_id',
        'progress',
        'completed_at',
    ];

    protected $casts = [
        'progress' => 'integer',
        'completed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }
}
