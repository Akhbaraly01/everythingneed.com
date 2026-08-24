<?php

namespace App\Models;

use Core\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class UserRole extends Model
{
    use HasUuid, SoftDeletes;

    protected $fillable = [
        'user_id', 'role', 'category_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
