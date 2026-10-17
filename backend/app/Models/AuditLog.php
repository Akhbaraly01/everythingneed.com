<?php

namespace App\Models;

use Core\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasUuid;

    public $timestamps = false;

    protected $fillable = [
        'action', 'entity_type', 'entity_id', 'performed_by', 'ip_address',
        'old_values', 'new_values', 'metadata', 'created_at',
        'prev_hash', 'hash',
    ];

    protected $casts = [
        'old_values' => 'json',
        'new_values' => 'json',
        'metadata' => 'json',
        'created_at' => 'datetime',
    ];
}
