<?php

namespace Modules\Orders\Entities;

use App\Models\Model;

class DisputeEvidence extends Model
{
    protected $table = 'dispute_evidence';

    protected $fillable = [
        'dispute_id',
        'uploaded_by',
        'file_url',
        'disk',
        'file_path',
        'original_filename',
        'signed_url_expires_at',
        'note',
    ];

    protected $casts = [
        'signed_url_expires_at' => 'datetime',
    ];

    public function dispute()
    {
        return $this->belongsTo(Dispute::class, 'dispute_id');
    }

    public function uploader()
    {
        return $this->belongsTo(\App\Models\User::class, 'uploaded_by');
    }
}
