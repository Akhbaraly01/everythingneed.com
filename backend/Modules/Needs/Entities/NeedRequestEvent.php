<?php

namespace Modules\Needs\Entities;

use App\Models\Model;

class NeedRequestEvent extends Model
{
    protected $table = 'need_request_events';

    protected $fillable = [
        'need_request_id',
        'actor_id',
        'from_status',
        'to_status',
        'action',
        'note',
    ];

    public function request()
    {
        return $this->belongsTo(NeedRequest::class, 'need_request_id');
    }

    public function actor()
    {
        return $this->belongsTo(\App\Models\User::class, 'actor_id');
    }
}
