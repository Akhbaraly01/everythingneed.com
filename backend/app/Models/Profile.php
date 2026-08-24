<?php

namespace App\Models;

use Core\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;

class Profile extends Model
{
    use HasUuid;

    protected $fillable = [
        'user_id',
        'email',
        'full_name',
        'phone',
        'avatar_url',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
