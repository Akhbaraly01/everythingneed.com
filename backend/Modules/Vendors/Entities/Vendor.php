<?php

namespace Modules\Vendors\Entities;

use App\Models\Model;
use Core\Support\HasSlug;
use Database\Factories\VendorFactory;
use Illuminate\Database\Eloquent\Factories\Factory;

class Vendor extends Model
{
    use HasSlug;

    protected static function newFactory(): Factory
    {
        return VendorFactory::new();
    }
    protected $fillable = [
        'user_id',
        'store_name',
        'slug',
        'category',
        'description',
        'is_verified',
        'rating',
        'settings',
    ];

    protected $casts = [
        'is_verified' => 'boolean',
        'rating' => 'decimal:1',
        'settings' => 'array',
    ];

    protected function slugSourceValue(): string
    {
        return (string) ($this->store_name ?? '');
    }

    /** Spec §34: the store is open for orders unless explicitly paused. */
    public function isAcceptingOrders(): bool
    {
        return (bool) ($this->settings['accepting_orders'] ?? true);
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function products()
    {
        return $this->hasMany(\Modules\Products\Entities\Product::class);
    }

    public function orders()
    {
        return $this->hasMany(\Modules\Orders\Entities\VendorOrder::class);
    }
}
