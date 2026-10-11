<?php

namespace Modules\Inventory\Entities;

use App\Models\Model;

class InventoryReservation extends Model
{
    public const MINUTES_TO_LIVE = 30;

    protected $fillable = [
        'product_id',
        'user_id',
        'quantity',
        'expires_at',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'expires_at' => 'datetime',
    ];

    public function product()
    {
        return $this->belongsTo(\Modules\Products\Entities\Product::class);
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    /**
     * Reservations that are still holding stock right now.
     */
    public function scopeActive($query)
    {
        return $query->where('expires_at', '>', now());
    }

    /**
     * Units of $productId reserved by everyone except $userId.
     */
    public static function reservedByOthers(string $productId, string $userId): int
    {
        return (int) static::query()
            ->active()
            ->where('product_id', $productId)
            ->where('user_id', '!=', $userId)
            ->sum('quantity');
    }
}
