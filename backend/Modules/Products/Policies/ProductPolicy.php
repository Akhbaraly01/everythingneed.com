<?php

namespace Modules\Products\Policies;

use App\Models\User;
use Modules\Products\Entities\Product;
use Illuminate\Auth\Access\HandlesAuthorization;

class ProductPolicy
{
    use HandlesAuthorization;

    /** Same console surface as routes/web.php /admin/products gate. */
    private function isCatalogueManager(User $user): bool
    {
        return $user->hasRole('super_admin')
            || $user->hasRole('administrator')
            || $user->hasRole('platform_ops');
    }

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Product $product): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $this->isCatalogueManager($user) || $user->vendor;
    }

    public function update(User $user, Product $product): bool
    {
        return $this->isCatalogueManager($user)
            || $product->vendor_id === $user->vendor?->id;
    }

    public function delete(User $user, Product $product): bool
    {
        return $this->isCatalogueManager($user)
            || $product->vendor_id === $user->vendor?->id;
    }
}
