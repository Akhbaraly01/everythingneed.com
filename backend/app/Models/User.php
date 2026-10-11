<?php

namespace App\Models;

use Core\Traits\HasUuid;
use Illuminate\Contracts\Auth\MustVerifyEmail;
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
use Modules\Healthcare\Entities\Doctor;

class User extends Authenticatable implements MustVerifyEmail
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

    public function twoFactorSecret()
    {
        return $this->hasOne(\Modules\Authentication\Entities\TwoFactorSecret::class, 'user_id');
    }

    public function hasRole(string $role): bool
    {
        return $this->roles()->where('role', $role)->exists();
    }

    /**
     * Granular RBAC check: role matrix UNION per-user grants (user_permissions).
     * super_admin implicitly holds every permission.
     *
     * W2: delegated to EffectivePermissionResolver (single owner of
     * effective-permission truth). Signature kept for all callers.
     *
     * Spec S64 2-segment aliases (e.g. "users.view") resolve to every canonical
     * 3-segment catalog entry sharing the same action (module.*.action), so a
     * single alias check is satisfied when the role holds any of them.
     */
    public function hasPermission(string $permission): bool
    {
        return app(\Core\Services\Contracts\EffectivePermissionResolverInterface::class)->has($this, $permission);
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

    public function doctor()
    {
        return $this->hasOne(Doctor::class);
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
