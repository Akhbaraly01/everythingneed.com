<?php

namespace Core\Enums;

enum AppRole: string
{
    // Original roles
    case SUPER_ADMIN      = 'super_admin';
    case MARKETPLACE_ADMIN = 'marketplace_admin';
    case CUSTOMER_SERVICE = 'customer_service';
    case USER             = 'user';

    // Extended enterprise roles
    case ADMINISTRATOR    = 'administrator';
    case PLATFORM_OPS     = 'platform_ops';
    case SECURITY_ADMIN   = 'security_admin';
    case VENDOR_ADMIN     = 'vendor_admin';
    case MODERATOR        = 'moderator';
    case SUPPORT_AGENT    = 'support_agent';
    case CONTENT_MANAGER  = 'content_manager';
    case ANALYTICS_ADMIN  = 'analytics_admin';
    case FINANCE_ADMIN    = 'finance_admin';
    case HEALTHCARE_ADMIN = 'healthcare_admin';
    case LEARNING_ADMIN   = 'learning_admin';

    // Vertical console roles (canonical set, see
    // ADMIN_WORKSPACE_AUTHORIZATION_MATRIX.md)
    case HOTEL_ADMIN       = 'hotel_admin';
    case FOOD_ADMIN        = 'food_admin';
    case TRANSPORT_ADMIN   = 'transport_admin';
    case AGRICULTURE_ADMIN = 'agriculture_admin';
    case BUILDING_ADMIN    = 'building_admin';
    case JOBS_ADMIN        = 'jobs_admin';
    case PHARMACY_ADMIN    = 'pharmacy_admin';
    case ORDERS_ADMIN      = 'orders_admin';
    case WALLET_ADMIN      = 'wallet_admin';
    case SUPPORT_ADMIN     = 'support_admin';
    case REAL_ESTATE_ADMIN = 'real_estate_admin';
    case NEEDS_ADMIN       = 'needs_admin';

    // L3 — review/verification roles (limited grants, no console management).
    case PAYOUT_REVIEWER   = 'payout_reviewer';
    case REFUND_AGENT      = 'refund_agent';
    case INVENTORY_MANAGER = 'inventory_manager';
    case CMS_EDITOR        = 'cms_editor';
    case AUDITOR           = 'auditor';
    case ANALYST           = 'analyst';
    case KYC_REVIEWER      = 'kyc_reviewer';
    case LEARNING_REVIEWER = 'learning_reviewer';
    case WORKER            = 'worker';

    // Spec §65 — named admin roles (roles are collections of permissions).
    case CATEGORY_ADMIN    = 'category_admin';
    case VENDOR_MANAGER    = 'vendor_manager';
    case CONTENT_ADMIN     = 'content_admin';

    /**
     * Returns a human-readable label for the role.
     */
    public function label(): string
    {
        return match ($this) {
            self::SUPER_ADMIN      => 'Super Admin',
            self::MARKETPLACE_ADMIN => 'Marketplace Admin',
            self::CUSTOMER_SERVICE => 'Customer Service',
            self::USER             => 'User',
            self::ADMINISTRATOR    => 'Administrator',
            self::PLATFORM_OPS     => 'Platform Operations',
            self::SECURITY_ADMIN   => 'Security Admin',
            self::VENDOR_ADMIN     => 'Vendor Admin',
            self::MODERATOR        => 'Moderator',
            self::SUPPORT_AGENT    => 'Support Agent',
            self::CONTENT_MANAGER  => 'Content Manager',
            self::ANALYTICS_ADMIN  => 'Analytics Admin',
            self::FINANCE_ADMIN    => 'Finance Admin',
            self::HEALTHCARE_ADMIN => 'Healthcare Admin',
            self::LEARNING_ADMIN   => 'Learning Admin',
            self::HOTEL_ADMIN       => 'Hotel Admin',
            self::FOOD_ADMIN        => 'Food Admin',
            self::TRANSPORT_ADMIN   => 'Transport Admin',
            self::AGRICULTURE_ADMIN => 'Agriculture Admin',
            self::BUILDING_ADMIN    => 'Building Admin',
            self::JOBS_ADMIN        => 'Jobs Admin',
            self::PHARMACY_ADMIN    => 'Pharmacy Admin',
            self::ORDERS_ADMIN      => 'Orders Admin',
            self::WALLET_ADMIN      => 'Wallet Admin',
            self::SUPPORT_ADMIN     => 'Support Admin',
            self::REAL_ESTATE_ADMIN => 'Real Estate Admin',
            self::NEEDS_ADMIN       => 'Needs Admin',
            self::PAYOUT_REVIEWER   => 'Payout Reviewer',
            self::REFUND_AGENT      => 'Refund Agent',
            self::INVENTORY_MANAGER => 'Inventory Manager',
            self::CMS_EDITOR        => 'CMS Editor',
            self::AUDITOR           => 'Auditor',
            self::ANALYST           => 'Analyst',
            self::KYC_REVIEWER      => 'KYC Reviewer',
            self::LEARNING_REVIEWER => 'Learning Reviewer',
            self::WORKER            => 'Worker',
            self::CATEGORY_ADMIN    => 'Category Admin',
            self::VENDOR_MANAGER    => 'Vendor Manager',
            self::CONTENT_ADMIN     => 'Content Admin',
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
            self::PLATFORM_OPS->value     => 7,
            self::SECURITY_ADMIN->value   => 6,
            self::VENDOR_ADMIN->value     => 6,
            self::MODERATOR->value        => 5,
            self::SUPPORT_AGENT->value    => 4,
            self::CONTENT_MANAGER->value  => 4,
            self::FINANCE_ADMIN->value    => 4,
            self::ANALYTICS_ADMIN->value  => 4,
            self::HEALTHCARE_ADMIN->value => 4,
            self::LEARNING_ADMIN->value   => 4,
            self::CUSTOMER_SERVICE->value => 3,
            self::MARKETPLACE_ADMIN->value => 3,
            self::KYC_REVIEWER->value    => 3,
            self::LEARNING_REVIEWER->value => 3,
            self::HOTEL_ADMIN->value       => 4,
            self::FOOD_ADMIN->value        => 4,
            self::TRANSPORT_ADMIN->value   => 4,
            self::AGRICULTURE_ADMIN->value => 4,
            self::BUILDING_ADMIN->value    => 4,
            self::JOBS_ADMIN->value        => 4,
            self::PHARMACY_ADMIN->value    => 4,
            self::ORDERS_ADMIN->value      => 4,
            self::WALLET_ADMIN->value      => 4,
            self::SUPPORT_ADMIN->value     => 4,
            self::REAL_ESTATE_ADMIN->value => 4,
            self::NEEDS_ADMIN->value       => 4,
            self::PAYOUT_REVIEWER->value   => 3,
            self::REFUND_AGENT->value      => 3,
            self::INVENTORY_MANAGER->value => 3,
            self::CMS_EDITOR->value        => 3,
            self::AUDITOR->value           => 3,
            self::ANALYST->value           => 3,
            self::CATEGORY_ADMIN->value    => 4,
            self::VENDOR_MANAGER->value    => 4,
            self::CONTENT_ADMIN->value     => 4,
            self::WORKER->value            => 1,
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
