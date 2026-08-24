<?php

namespace App\Models;

use Core\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;

class Wallet extends Model
{
    use HasUuid;

    protected $fillable = [
        'user_id', 'balance', 'currency',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function transactions()
    {
        return $this->hasMany(WalletTransaction::class);
    }
}
