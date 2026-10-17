<?php

namespace Modules\Reviews\Entities;

use App\Models\Model;

class ReviewReport extends Model
{
    protected $table = 'review_reports';

    public const STATUS_OPEN = 'open';
    public const STATUS_REVIEWED = 'reviewed';
    public const STATUS_DISMISSED = 'dismissed';

    protected $fillable = [
        'review_id',
        'reporter_id',
        'reason',
        'status',
    ];

    public function review()
    {
        return $this->belongsTo(Review::class, 'review_id');
    }

    public function reporter()
    {
        return $this->belongsTo(\App\Models\User::class, 'reporter_id');
    }
}
