<?php

namespace Modules\Jobs\Entities;

use App\Models\Model;

class JobPost extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'description',
        'company',
        'company_id',
        'location',
        'job_type',
        'salary_min',
        'salary_max',
        'currency',
        'requirements',
        'benefits',
        'is_active',
        'expires_at',
    ];

    protected $casts = [
        'salary_min' => 'decimal:2',
        'salary_max' => 'decimal:2',
        'requirements' => 'array',
        'benefits' => 'array',
        'is_active' => 'boolean',
        'expires_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    /**
     * N-32: named companyProfile (not `company`) so the relation never
     * shadows the legacy `company` string attribute in JSON payloads —
     * it serializes as `company_profile`.
     */
    public function companyProfile()
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    public function applications()
    {
        return $this->hasMany(JobApplication::class);
    }
}
