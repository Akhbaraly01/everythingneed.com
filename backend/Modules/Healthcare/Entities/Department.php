<?php

namespace Modules\Healthcare\Entities;

use App\Models\Model;

class Department extends Model
{
    protected $fillable = [
        'name',
        'description',
    ];
}
