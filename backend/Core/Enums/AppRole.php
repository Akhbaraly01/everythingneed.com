<?php

namespace Core\Enums;

enum AppRole: string
{
    // Original roles
    case SUPER_ADMIN      = 'super_admin';
    case CATEGORY_ADMIN   = 'category_admin';
    case CUSTOMER_SERVICE = 'customer_service';
    case USER             = 'user';

    // Extended enterprise roles
    case ADMINISTRATOR    = 'administrator';
    case VENDOR_ADMIN     = 'vendor_admin';
    case MODERATOR        = 'moderator';
    case SUPPORT_STAFF    = 'support_staff';
    case CONTENT_MANAGER  = 'content_manager';
    case FINANCE_ADMIN    = 'finance_admin';
    case HEALTHCARE_ADMIN = 'healthcare_admin';
    case LEARNING_ADMIN   = 'learning_admin';

    /**
     * Returns a human-readable label for the role.
     */
    public function label(): string
    {
        return match ($this) {
            self::SUPER_ADMIN      => 'Super Admin',
            self::CATEGORY_ADMIN   => 'Category Admin',
            self::CUSTOMER_SERVICE => 'Customer Service',
            self::USER             => 'User',
            self::ADMINISTRATOR    => 'Administrator',
            self::VENDOR_ADMIN     => 'Vendor Admin',
            self::MODERATOR        => 'Moderator',
            self::SUPPORT_STAFF    => 'Support Staff',
            self::CONTENT_MANAGER  => 'Content Manager',
            self::FINANCE_ADMIN    => 'Finance Admin',
            self::HEALTHCARE_ADMIN => 'Healthcare Admin',
            self::LEARNING_ADMIN   => 'Learning Admin',
        };
    }

    /**
     * Returns role hierarchy weights.
     * Higher weight = more authority.
     *
     * @return array<string, int>
     */
    public static function hierarchy(): array
    {
        return [
            self::SUPER_ADMIN->value      => 10,
            self::ADMINISTRATOR->value    => 8,
            self::VENDOR_ADMIN->value     => 6,
            self::MODERATOR->value        => 5,
            self::SUPPORT_STAFF->value    => 4,
            self::CONTENT_MANAGER->value  => 4,
            self::FINANCE_ADMIN->value    => 4,
            self::HEALTHCARE_ADMIN->value => 4,
            self::LEARNING_ADMIN->value   => 4,
            self::CUSTOMER_SERVICE->value => 3,
            self::CATEGORY_ADMIN->value   => 3,
            self::USER->value             => 1,
        ];
    }

    /**
     * Checks if this role has at least the authority of $requiredRole.
     */
    public function canAccess(AppRole $requiredRole): bool
    {
        $hierarchy = self::hierarchy();
        $myWeight       = $hierarchy[$this->value]          ?? 0;
        $requiredWeight = $hierarchy[$requiredRole->value]  ?? 0;

        return $myWeight >= $requiredWeight;
    }

    /**
     * Returns all role values as a plain array of strings.
     *
     * @return string[]
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
