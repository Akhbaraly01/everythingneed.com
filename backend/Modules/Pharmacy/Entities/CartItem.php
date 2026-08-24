<?php

namespace Modules\Pharmacy\Entities;

use App\Models\Model;

class CartItem extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'medicine_id',
        'quantity',
    ];

    protected $casts = [
        'quantity' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function medicine()
    {
        return $this->belongsTo(Medicine::class);
    }
}
