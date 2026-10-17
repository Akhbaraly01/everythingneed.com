<?php

namespace Modules\Jobs\Entities;

use App\Models\Model;

/**
 * N-32 company profile: the employer's public page (/companies/{slug}).
 * Slug is assigned once on create and never changes — links must survive
 * a rename. One profile per owner in v1 (enforced by the controller).
 */
class Company extends Model
{
    protected $table = 'companies';

    protected $fillable = [
        'user_id',
        'name',
        'slug',
        'logo_path',
        'description',
        'website',
        'industry',
        'company_size',
        'location',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class, 'user_id');
    }

    /** Active job posts attached to this company. */
    public function jobs()
    {
        return $this->hasMany(JobPost::class, 'company_id')
            ->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            });
    }
}
