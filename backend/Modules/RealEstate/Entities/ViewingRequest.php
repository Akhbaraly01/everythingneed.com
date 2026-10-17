<?php

namespace Modules\RealEstate\Entities;

use App\Models\Model;

class ViewingRequest extends Model
{
    protected $fillable = [
        'property_id',
        'user_id',
        'name',
        'email',
        'phone',
        'message',
        'viewing_date',
        'viewing_time',
        'status',
    ];

    protected $casts = [
        'viewing_date' => 'date',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_APPROVED = 'approved';
    const STATUS_REJECTED = 'rejected';
    const STATUS_COMPLETED = 'completed';

    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}
