<?php

namespace App\Models;

use Core\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasUuid;

    public $timestamps = false;

    protected $fillable = [
        'action', 'entity_type', 'entity_id', 'performed_by',
        'old_values', 'new_values', 'created_at',
    ];

    protected $casts = [
        'old_values' => 'json',
        'new_values' => 'json',
        'created_at' => 'datetime',
    ];
}
