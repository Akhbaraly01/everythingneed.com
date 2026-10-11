<?php

/**
 * Workspace routing decisions (single source of truth for auth landing).
 * Used by Core\Services\WorkspaceResolver and asserted by
 * tests/Unit/WorkspaceResolverTest.php.
 */

return [

    /*
     * Role landing priority: first role the user holds wins. Order mirrors
     * ADMIN_WORKSPACE_AUTHORIZATION_MATRIX.md.
     */
    'landing_priority' => [
        'super_admin',
        'administrator',
        'platform_ops',
        'security_admin',
        'finance_admin',
        'healthcare_admin',
        'learning_admin',
        'learning_reviewer',
        'support_agent',
        'customer_service',
        'content_manager',
        'analytics_admin',
        'marketplace_admin',
        'category_admin',
        'moderator',
        'orders_admin',
        'wallet_admin',
        'support_admin',
        'real_estate_admin',
        'needs_admin',
        'hotel_admin',
        'food_admin',
        'transport_admin',
        'jobs_admin',
        'pharmacy_admin',
        'agriculture_admin',
        'building_admin',
        'kyc_reviewer',
        'payout_reviewer',
        'refund_agent',
        'inventory_manager',
        'cms_editor',
        'content_admin',
        'auditor',
        'analyst',
        'vendor_admin',
        'vendor_manager',
        'worker',
    ],

    'landings' => [
        'super_admin' => '/admin/dashboard',
        'administrator' => '/admin/dashboard',
        'platform_ops' => '/admin/dashboard',
        'security_admin' => '/admin/dashboard',
        'finance_admin' => '/admin/finance',
        'healthcare_admin' => '/admin/healthcare/doctors',
        'learning_admin' => '/admin/learning/courses',
        'learning_reviewer' => '/admin/learning/review',
        'support_agent' => '/admin/support/tickets',
        'customer_service' => '/admin/support/tickets',
        'content_manager' => '/admin/cms',
        'content_admin' => '/admin/cms',
        'analytics_admin' => '/admin/dashboard',
        'marketplace_admin' => '/admin/categories',
        'category_admin' => '/admin/categories',
        'moderator' => '/admin/approvals',
        'orders_admin' => '/admin/orders',
        'wallet_admin' => '/admin/wallet',
        'support_admin' => '/admin/support/tickets',
        'real_estate_admin' => '/admin/real-estate',
        'needs_admin' => '/admin/dashboard',
        'hotel_admin' => '/admin/hotels',
        'food_admin' => '/admin/food',
        'transport_admin' => '/admin/transport',
        'jobs_admin' => '/admin/jobs',
        'pharmacy_admin' => '/admin/dashboard',
        'agriculture_admin' => '/admin/dashboard',
        'building_admin' => '/admin/dashboard',
        'kyc_reviewer' => '/admin/dashboard',
        'payout_reviewer' => '/admin/payouts',
        'refund_agent' => '/admin/orders',
        'inventory_manager' => '/admin/inventory',
        'cms_editor' => '/admin/cms',
        'auditor' => '/admin/audit-logs',
        'analyst' => '/admin/dashboard',
        'vendor_admin' => '/vendor',
        'vendor_manager' => '/admin/vendors',
        'worker' => '/provider',
        'user' => '/dashboard',
    ],

    // Fallback for roles absent from the map above.
    'default_landing' => '/dashboard',

    // Roles that belong to the administration console (adminHrefs + sidebar).
    'admin_console_roles' => [
        'super_admin', 'administrator', 'platform_ops', 'security_admin', 'finance_admin',
        'healthcare_admin', 'learning_admin', 'learning_reviewer', 'support_agent', 'customer_service',
        'content_manager', 'analytics_admin', 'marketplace_admin', 'moderator',
        'hotel_admin', 'food_admin', 'transport_admin', 'jobs_admin', 'pharmacy_admin',
        'agriculture_admin', 'building_admin', 'kyc_reviewer',
        'orders_admin', 'wallet_admin', 'support_admin', 'real_estate_admin', 'needs_admin',
        'payout_reviewer', 'refund_agent', 'inventory_manager', 'cms_editor', 'auditor', 'analyst',
        'category_admin', 'vendor_manager', 'content_admin',
    ],

    // Roles that belong to the provider/worker console.
    'provider_console_roles' => ['worker'],

    // Roles that belong to the vendor console.
    'vendor_console_roles' => ['vendor_admin'],
];
