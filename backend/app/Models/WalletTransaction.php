<?php

namespace App\Models;

use Core\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;

class WalletTransaction extends Model
{
    use HasUuid;

    public $timestamps = false;

    protected $fillable = [
        'wallet_id', 'type', 'amount', 'balance_after',
        'reference', 'description', 'created_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'balance_after' => 'decimal:2',
        'created_at' => 'datetime',
    ];

    public function wallet()
    {
        return $this->belongsTo(Wallet::class);
    }
}
