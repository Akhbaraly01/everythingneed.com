<?php

namespace Modules\Engagement\Entities;

use App\Models\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductComparison extends Model
{
    /** Hard cap keeps payloads sane and matches the UI's compare tray. */
    public const MAX_ITEMS = 3;

    protected $table = 'product_comparisons';

    protected $fillable = [
        'user_id',
        'product_id',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(\Modules\Products\Entities\Product::class);
    }
}
