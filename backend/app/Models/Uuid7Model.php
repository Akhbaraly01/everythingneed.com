<?php

namespace App\Models;

use Core\Traits\HasUuid7;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model as BaseModel;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Base model for no-code platform entities (spec S70: UUIDv7).
 * Mirrors App\Models\Model but uses time-ordered UUIDv7 primary keys.
 */
abstract class Uuid7Model extends BaseModel
{
    use HasFactory, HasUuid7, SoftDeletes;

    protected $guarded = ['id'];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];
}
