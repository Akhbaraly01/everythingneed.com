<?php

namespace App\Models;

use Core\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Modules\Users\Entities\Address;
use Modules\Vendors\Entities\Vendor;
use Modules\Notifications\Entities\Notification;
use Modules\Users\Entities\UserCertificate;
use Modules\Learn\Entities\Enrollment;
use Modules\Engagement\Entities\Wishlist;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasUuid, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'user_metadata',
        'last_activity_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'user_metadata' => 'array',
        'last_activity_at' => 'datetime',
    ];

    public function profile()
    {
        return $this->hasOne(Profile::class);
    }

    public function roles()
    {
        return $this->hasMany(UserRole::class);
    }

    public function hasRole(string $role): bool
    {
        return $this->roles()->where('role', $role)->exists();
    }

    /**
     * Granular RBAC check against the seeded role→permission matrix.
     * super_admin implicitly holds every permission.
     */
    public function hasPermission(string $permission): bool
    {
        if ($this->hasRole('super_admin')) {
            return true;
        }

        $matrix = \Illuminate\Support\Facades\Cache::remember('rbac.matrix', 300, function () {
            return \Illuminate\Support\Facades\DB::table('role_permissions')
                ->get()
                ->groupBy('role')
                ->map->pluck('permission');
        });

        return $this->roles()->get(['role'])->contains(
            fn ($r) => ($matrix[$r->role] ?? collect())->contains($permission),
        );
    }

    public function wallet()
    {
        return $this->hasOne(Wallet::class);
    }

    public function addresses()
    {
        return $this->hasMany(Address::class);
    }

    public function vendor()
    {
        return $this->hasOne(Vendor::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public function certificates()
    {
        return $this->hasMany(UserCertificate::class);
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    public function wishlist()
    {
        return $this->hasMany(Wishlist::class);
    }
}
