<?php

namespace Modules\Needs\Entities;

use App\Models\Model;

class TaskPost extends Model
{
    public const STATUS_OPEN = 'open';
    public const STATUS_IN_REVIEW = 'in_review';
    public const STATUS_ASSIGNED = 'assigned';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'created_by',
        'post_number',
        'title',
        'description',
        'quantity',
        'budget',
        'deadline',
        'requirements',
        'status',
        'assigned_application_id',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'budget' => 'decimal:2',
        'deadline' => 'date',
        'requirements' => 'array',
    ];

    public function applications()
    {
        return $this->hasMany(TaskApplication::class);
    }

    public function owner()
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }
}
