<?php

namespace Modules\Needs\Entities;

use App\Models\Model;

class NeedOfferRevision extends Model
{
    protected $table = 'need_offer_revisions';

    public $timestamps = false;

    protected $fillable = [
        'need_offer_id',
        'revision_no',
        'price',
        'message',
        'scope_of_work',
        'deliverables',
        'exclusions',
        'estimated_duration',
        'terms',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'revision_no' => 'integer',
    ];

    public function offer()
    {
        return $this->belongsTo(NeedOffer::class, 'need_offer_id');
    }
}
