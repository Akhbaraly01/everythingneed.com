<?php

namespace Modules\Users\Entities;

use App\Models\Model;

class UserCertificate extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'course_id',
        'course_title',
        'instructor_name',
        'certificate_number',
        'issued_at',
    ];

    protected $casts = [
        'issued_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function course()
    {
        return $this->belongsTo(\Modules\Learn\Entities\Course::class);
    }
}
