<?php

namespace Modules\Needs\Entities;

use App\Models\Model;

/**
 * N-24 workroom: one row per shared file on an engaged request. The
 * bytes live on a private disk (path column is relative to it); there is
 * no public URL field anywhere — downloads only happen through freshly
 * signed URLs.
 */
class NeedFile extends Model
{
    protected $fillable = [
        'need_request_id',
        'uploader_id',
        'original_name',
        'disk',
        'path',
        'size',
        'mime',
    ];

    protected $casts = [
        'size' => 'integer',
    ];

    public function request()
    {
        return $this->belongsTo(NeedRequest::class, 'need_request_id');
    }

    public function uploader()
    {
        return $this->belongsTo(\App\Models\User::class, 'uploader_id');
    }
}
