<?php

namespace Modules\Jobs\Entities;

use App\Models\Model;

class JobApplication extends Model
{
    protected $fillable = [
        'job_post_id',
        'user_id',
        'resume_url',
        'cover_letter',
        'status',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_REVIEWED = 'reviewed';
    const STATUS_SHORTLISTED = 'shortlisted';
    const STATUS_REJECTED = 'rejected';
    const STATUS_Hired = 'hired';

    public function jobPost()
    {
        return $this->belongsTo(JobPost::class);
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}
