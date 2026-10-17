<?php

use Illuminate\Support\Facades\Route;
use Modules\Admin\Http\Controllers\AdminStatsController;
use Modules\Admin\Http\Controllers\AdminUserController;
use Modules\Admin\Http\Controllers\AdminVendorController;
use Modules\Admin\Http\Controllers\AdminOrderController;
use Modules\Admin\Http\Controllers\AdminAuditController;
use Modules\Admin\Http\Controllers\AdminSettingsController;
use Modules\Admin\Http\Controllers\AdminFinanceController;
use Modules\Admin\Http\Controllers\AdminAnalyticsController;
use Modules\Admin\Http\Controllers\AdminReportController;
use Modules\Admin\Http\Controllers\AdminCmsController;
use Modules\Admin\Http\Controllers\AdminPageBuilderController;
use Modules\Admin\Http\Controllers\AdminNavigationController;
use Modules\Admin\Http\Controllers\AdminMediaController;
use Modules\Admin\Http\Controllers\AdminDynamicModuleController;
use Modules\Admin\Http\Controllers\AdminCmsFormController;
use Modules\Admin\Http\Controllers\AdminSupportController;
use Modules\Admin\Http\Controllers\AdminRbacController;
use Modules\Admin\Http\Controllers\AdminProductApprovalController;
use Modules\Admin\Http\Controllers\AdminDepartmentController;
use Modules\Admin\Http\Controllers\AdminHomeSectionController;
use Modules\Admin\Http\Controllers\AdminBrandController;
use Modules\Admin\Http\Controllers\AdminKycController;
use Modules\Admin\Http\Controllers\AdminNeedsController;
use App\Http\Controllers\Api\AdminDomainController;
use App\Http\Middleware\EnsureAccountActive;

/*
|--------------------------------------------------------------------------
| Admin Module API Routes
|--------------------------------------------------------------------------
*/

Route::prefix('api/admin')->middleware(['api', 'auth:sanctum', EnsureAccountActive::class])->group(function () {

    // Dashboard stats
    Route::get('/stats', [AdminStatsController::class, 'index'])
        ->can('viewDashboard');
    Route::get('/stats/system', [AdminStatsController::class, 'system'])
        ->can('manageSettings');

    // User management
    Route::get('/users', [AdminUserController::class, 'index'])
        ->can('manageUsers');
    Route::post('/users', [AdminUserController::class, 'store'])
        ->middleware('permission:users.users.create')
        ->can('manageUsers');
    Route::get('/users/{id}', [AdminUserController::class, 'show'])
        ->can('manageUsers');
    Route::put('/users/{id}/role', [AdminUserController::class, 'updateRole'])
        ->can('manageUsers');
    Route::post('/users/{id}/suspend', [AdminUserController::class, 'suspend'])
        ->can('manageUsers');
    Route::post('/users/{id}/restore', [AdminUserController::class, 'restore'])
        ->can('manageUsers');
    Route::delete('/users/{id}', [AdminUserController::class, 'destroy'])
        ->can('manageUsers');

    // Vendor management
    Route::get('/vendors', [AdminVendorController::class, 'index'])
        ->can('manageVendors');
    Route::get('/vendors/{id}', [AdminVendorController::class, 'show'])
        ->can('manageVendors');
    Route::post('/vendors/{id}/approve', [AdminVendorController::class, 'approve'])
        ->can('manageVendors');
    Route::post('/vendors/{id}/reject', [AdminVendorController::class, 'reject'])
        ->can('manageVendors');
    Route::post('/vendors/{id}/suspend', [AdminVendorController::class, 'suspend'])
        ->can('manageVendors');
    Route::post('/vendors/{id}/restore', [AdminVendorController::class, 'restore'])
        ->can('manageVendors');

    // Order management
    Route::get('/orders', [AdminOrderController::class, 'index'])
        ->can('manageOrders');
    Route::get('/orders/{id}', [AdminOrderController::class, 'show'])
        ->can('manageOrders');
    Route::put('/orders/{id}/status', [AdminOrderController::class, 'updateStatus'])
        ->can('manageOrders');
    Route::post('/orders/{id}/refund', [AdminOrderController::class, 'refund'])
        ->can('manageOrders');

    // Finance management
    Route::get('/finance/summary', [AdminFinanceController::class, 'summary'])
        ->can('manageFinance');
    Route::get('/finance/transactions', [AdminFinanceController::class, 'transactions'])
        ->can('manageFinance');
    Route::get('/finance/withdrawals', [AdminFinanceController::class, 'withdrawals'])
        ->can('manageFinance');
    Route::post('/finance/withdrawals/{id}/process', [AdminFinanceController::class, 'processWithdrawal'])
        ->can('manageFinance');

    // Analytics (gate mirrors the /admin/analytics web group)
    Route::get('/analytics/overview', [AdminAnalyticsController::class, 'overview'])
        ->can('viewAnalytics');
    Route::get('/analytics/user-growth', [AdminAnalyticsController::class, 'userGrowth'])
        ->can('viewAnalytics');
    Route::get('/analytics/revenue', [AdminAnalyticsController::class, 'revenue'])
        ->can('viewAnalytics');
    Route::get('/analytics/categories', [AdminAnalyticsController::class, 'categories'])
        ->can('viewAnalytics');
    Route::get('/analytics/traffic', [AdminAnalyticsController::class, 'traffic'])
        ->can('viewAnalytics');
    // Spec §63 — domain series (bookings/healthcare/learning/needs/services/
    // wallet/payments/orders) + conversion funnel in one payload.
    Route::get('/analytics/domains', [AdminAnalyticsController::class, 'domains'])
        ->can('viewAnalytics');
    // CSV export — tighter gate than viewAnalytics: only roles holding the
    // analytics.overview.export permission (super, analytics_admin,
    // administrator) can pull data out.
    Route::get('/analytics/export', [AdminAnalyticsController::class, 'export'])
        ->middleware('permission:analytics.overview.export');

    // Reports (W5.4) — reports.reports.view to read, reports.reports.export
    // to download the CSV (auditor holds both; analyst is view-only).
    Route::get('/reports/sales', [AdminReportController::class, 'sales'])
        ->middleware('permission:reports.reports.view');
    Route::get('/reports/analytics', [AdminReportController::class, 'analytics'])
        ->middleware('permission:reports.reports.view');
    Route::get('/reports/export', [AdminReportController::class, 'export'])
        ->middleware('permission:reports.reports.export');

// CMS management
    Route::get('/cms/pages', [AdminCmsController::class, 'pages'])
        ->can('manageCms');
    Route::post('/cms/pages', [AdminCmsController::class, 'createPage'])
        ->can('manageCms');
    Route::put('/cms/pages/{id}', [AdminCmsController::class, 'updatePage'])
        ->can('manageCms');
    Route::delete('/cms/pages/{id}', [AdminCmsController::class, 'deletePage'])
        ->can('manageCms');
    Route::get('/cms/blog', [AdminCmsController::class, 'blog'])
        ->can('manageCms');
    Route::post('/cms/blog', [AdminCmsController::class, 'createBlog'])
        ->can('manageCms');
    Route::put('/cms/blog/{id}', [AdminCmsController::class, 'updateBlog'])
        ->can('manageCms');
    Route::delete('/cms/blog/{id}', [AdminCmsController::class, 'deleteBlog'])
        ->can('manageCms');
    Route::get('/cms/banners', [AdminCmsController::class, 'banners'])
        ->can('manageCms');
    Route::post('/cms/banners', [AdminCmsController::class, 'createBanner'])
        ->can('manageCms');
    Route::put('/cms/banners/{id}', [AdminCmsController::class, 'updateBanner'])
        ->can('manageCms');
    Route::delete('/cms/banners/{id}', [AdminCmsController::class, 'deleteBanner'])
        ->can('manageCms');

    // Home page builder (Home rebuild): admins reorder + toggle storefront
    // sections; create/delete stay Super Admin-only (role gate below).
    Route::get('/home-sections', [AdminHomeSectionController::class, 'index'])
        ->middleware('permission:cms.home.view')
        ->can('manageCms');
    Route::post('/home-sections', [AdminHomeSectionController::class, 'store'])
        ->middleware(['role:super_admin', 'permission:cms.home.manage'])
        ->can('manageCms');
    Route::put('/home-sections/reorder', [AdminHomeSectionController::class, 'reorder'])
        ->middleware('permission:cms.home.manage')
        ->can('manageCms');
    Route::put('/home-sections/{id}', [AdminHomeSectionController::class, 'update'])
        ->middleware('permission:cms.home.manage')
        ->can('manageCms');
    Route::delete('/home-sections/{id}', [AdminHomeSectionController::class, 'destroy'])
        ->middleware(['role:super_admin', 'permission:cms.home.manage'])
        ->can('manageCms');
    Route::get('/cms/announcements', [AdminCmsController::class, 'announcements'])
        ->can('manageCms');
    Route::post('/cms/announcements', [AdminCmsController::class, 'createAnnouncement'])
        ->can('manageCms');
    Route::put('/cms/announcements/{id}', [AdminCmsController::class, 'updateAnnouncement'])
        ->can('manageCms');
    Route::delete('/cms/announcements/{id}', [AdminCmsController::class, 'deleteAnnouncement'])
        ->can('manageCms');

    // No-code page builder (Wave C - spec S40-S45, S68, S99): closed block
    // registry + revision history, gated by the granular cms.* permissions
    // on top of the manageCms role gate.
    Route::get('/cms/blocks/registry', [AdminPageBuilderController::class, 'registry'])
        ->middleware('permission:cms.blocks.view')
        ->can('manageCms');
    Route::get('/cms/pages/{id}/blocks', [AdminPageBuilderController::class, 'blocks'])
        ->middleware('permission:cms.blocks.view')
        ->can('manageCms');
    Route::put('/cms/pages/{id}/blocks', [AdminPageBuilderController::class, 'saveBlocks'])
        ->middleware('permission:cms.blocks.manage')
        ->can('manageCms');
    Route::get('/cms/pages/{id}/revisions', [AdminPageBuilderController::class, 'revisions'])
        ->middleware('permission:cms.revisions.view')
        ->can('manageCms');
    Route::get('/cms/pages/{id}/revisions/{version}', [AdminPageBuilderController::class, 'revision'])
        ->middleware('permission:cms.revisions.view')
        ->can('manageCms');
    Route::post('/cms/pages/{id}/revisions/{version}/restore', [AdminPageBuilderController::class, 'restore'])
        ->middleware('permission:cms.revisions.restore')
        ->can('manageCms');

    // Navigation builder (Wave C - spec S46)
    Route::get('/navigations', [AdminNavigationController::class, 'index'])
        ->middleware('permission:navigation.view')
        ->can('manageCms');
    Route::post('/navigations', [AdminNavigationController::class, 'store'])
        ->middleware('permission:navigation.manage')
        ->can('manageCms');
    Route::put('/navigations/{id}', [AdminNavigationController::class, 'update'])
        ->middleware('permission:navigation.manage')
        ->can('manageCms');
    Route::delete('/navigations/{id}', [AdminNavigationController::class, 'destroy'])
        ->middleware('permission:navigation.manage')
        ->can('manageCms');
    Route::put('/navigations/{id}/items', [AdminNavigationController::class, 'replaceItems'])
        ->middleware('permission:navigation.manage')
        ->can('manageCms');

    // Media library (Wave C - spec S44/S86; W1 adds the permission-gated
    // shared-library upload alongside the personal /api/upload endpoint)
    Route::get('/media', [AdminMediaController::class, 'index'])
        ->middleware('permission:media.view')
        ->can('manageCms');
    Route::post('/media', [AdminMediaController::class, 'store'])
        ->middleware('permission:media.manage')
        ->can('manageCms');
    Route::delete('/media/{id}', [AdminMediaController::class, 'destroy'])
        ->middleware('permission:media.manage')
        ->can('manageCms');

    // No-code dynamic modules (W3 - spec S40/S47): schema-declared
    // entities with validated entries; published modules read publicly.
    Route::get('/modules', [AdminDynamicModuleController::class, 'index'])
        ->middleware('permission:modules.view');
    Route::post('/modules', [AdminDynamicModuleController::class, 'store'])
        ->middleware('permission:modules.manage');
    Route::get('/modules/{id}', [AdminDynamicModuleController::class, 'show'])
        ->middleware('permission:modules.view');
    Route::put('/modules/{id}', [AdminDynamicModuleController::class, 'update'])
        ->middleware('permission:modules.manage');
    Route::delete('/modules/{id}', [AdminDynamicModuleController::class, 'destroy'])
        ->middleware('permission:modules.manage');
    Route::get('/modules/{id}/entries', [AdminDynamicModuleController::class, 'entries'])
        ->middleware('permission:modules.view');
    Route::post('/modules/{id}/entries', [AdminDynamicModuleController::class, 'storeEntry'])
        ->middleware('permission:modules.manage');
    Route::put('/modules/{id}/entries/{entryId}', [AdminDynamicModuleController::class, 'updateEntry'])
        ->middleware('permission:modules.manage');
    Route::delete('/modules/{id}/entries/{entryId}', [AdminDynamicModuleController::class, 'destroyEntry'])
        ->middleware('permission:modules.manage');

    Route::get('/forms', [AdminCmsFormController::class, 'index'])
        ->middleware('permission:forms.view');
    Route::post('/forms', [AdminCmsFormController::class, 'store'])
        ->middleware('permission:forms.manage');
    Route::get('/forms/{formId}', [AdminCmsFormController::class, 'show'])
        ->middleware('permission:forms.view');
    Route::put('/forms/{formId}', [AdminCmsFormController::class, 'update'])
        ->middleware('permission:forms.manage');
    Route::delete('/forms/{formId}', [AdminCmsFormController::class, 'destroy'])
        ->middleware('permission:forms.manage');
    Route::get('/forms/{formId}/submissions', [AdminCmsFormController::class, 'submissions'])
        ->middleware('permission:forms.view');

    // Support tickets
    Route::get('/support/tickets', [AdminSupportController::class, 'tickets'])
        ->can('manageSupport');
    Route::get('/support/tickets/{id}', [AdminSupportController::class, 'show'])
        ->can('manageSupport');
    Route::patch('/support/tickets/{id}/assign', [AdminSupportController::class, 'assign'])
        ->can('manageSupport');

    // Audit logs
    Route::get('/audit-logs', [AdminAuditController::class, 'index'])
        ->can('viewAuditLogs');
    // Distinct action vocabulary for the console filter dropdown.
    Route::get('/audit-logs/actions', [AdminAuditController::class, 'actions'])
        ->can('viewAuditLogs');
    // CSV export: view policy AND the export permission (holders of
    // audit.logs.export = super, security_admin, auditor, administrator;
    // the view policy keeps administrator out — permission alone is not enough).
    Route::get('/audit-logs/export', [AdminAuditController::class, 'export'])
        ->middleware('permission:audit.logs.export')
        ->can('viewAuditLogs');

    // System settings & feature flags
    Route::get('/settings', [AdminSettingsController::class, 'index'])
        ->can('manageSettings');
    Route::get('/ui-texts', [AdminSettingsController::class, 'uiTexts'])
        ->can('manageSettings');
    Route::put('/settings', [AdminSettingsController::class, 'update'])
        ->can('manageSettings');
    Route::delete('/settings/{key}', [AdminSettingsController::class, 'destroy'])
        ->can('manageSettings');
    Route::get('/feature-flags', [AdminSettingsController::class, 'featureFlags'])
        ->can('manageSettings');
    Route::put('/feature-flags/{key}', [AdminSettingsController::class, 'toggleFlag'])
        ->can('manageSettings');

    // RBAC management
    Route::get('/roles', [AdminRbacController::class, 'roles'])
        ->can('manageUsers');

    // Product approval queue
    Route::get('/products/pending', [AdminProductApprovalController::class, 'pending'])
        ->middleware('permission:products.products.approve');
    Route::post('/products/{id}/approve', [AdminProductApprovalController::class, 'approve'])
        ->middleware('permission:products.products.approve');
    Route::post('/products/{id}/reject', [AdminProductApprovalController::class, 'reject'])
        ->middleware('permission:products.products.approve');

    // Departments (shared by support + healthcare)
    Route::get('/departments', [AdminDepartmentController::class, 'index'])
        ->middleware('role:super_admin,administrator,customer_service,support_agent,support_admin');
    Route::post('/departments', [AdminDepartmentController::class, 'store'])
        ->middleware('role:super_admin,administrator');
    Route::put('/departments/{id}', [AdminDepartmentController::class, 'update'])
        ->middleware('role:super_admin,administrator');
    Route::delete('/departments/{id}', [AdminDepartmentController::class, 'destroy'])
        ->middleware('role:super_admin,administrator');

    Route::get('/permissions', [AdminRbacController::class, 'permissions'])
        ->can('manageUsers');
    Route::get('/rbac/matrix', [AdminRbacController::class, 'matrix'])
        ->middleware('role:super_admin');
    Route::post('/rbac/grant', [AdminRbacController::class, 'grant'])
        ->middleware('role:super_admin');
    Route::post('/rbac/revoke', [AdminRbacController::class, 'revoke'])
        ->middleware('role:super_admin');
    Route::get('/users/{id}/permissions', [AdminRbacController::class, 'userPermissions'])
        ->middleware('role:super_admin');
    Route::post('/users/{id}/permissions', [AdminRbacController::class, 'grantUserPermission'])
        ->middleware('role:super_admin');
    Route::delete('/users/{id}/permissions/{permission}', [AdminRbacController::class, 'revokeUserPermission'])
        ->middleware('role:super_admin');
    Route::get('/rbac/scopes', [AdminRbacController::class, 'scopes'])
        ->middleware('role:super_admin');
    Route::post('/rbac/scopes', [AdminRbacController::class, 'grantScope'])
        ->middleware('role:super_admin');
    Route::delete('/rbac/scopes/{id}', [AdminRbacController::class, 'revokeScope'])
        ->middleware('role:super_admin');
    Route::put('/roles/assign', [AdminRbacController::class, 'updateRole'])
        ->can('manageUsers');

    // Brand management (category_admin: spec §65 Category Admin console).
    Route::get('/brands', [AdminBrandController::class, 'index'])
        ->middleware('role:super_admin,administrator,marketplace_admin,category_admin');
    Route::post('/brands', [AdminBrandController::class, 'store'])
        ->middleware('role:super_admin,administrator,marketplace_admin,category_admin');
    Route::put('/brands/{id}', [AdminBrandController::class, 'update'])
        ->middleware('role:super_admin,administrator,marketplace_admin,category_admin');
    Route::delete('/brands/{id}', [AdminBrandController::class, 'destroy'])
        ->middleware('role:super_admin,administrator,marketplace_admin,category_admin');

    // KYC review queue (decisions reuse POST /api/kyc/{id}/review)
    Route::get('/kyc', [AdminKycController::class, 'index'])
        ->middleware('permission:kyc.applications.view');

    // Domain consoles (AdminDomainController) — role lists mirror the web
    // console groups that render the consuming pages.
    Route::get('/pharmacy/orders', [AdminDomainController::class, 'pharmacyOrders'])
        ->middleware('role:super_admin,administrator,pharmacy_admin');
    Route::get('/building/bookings', [AdminDomainController::class, 'buildingBookings'])
        ->middleware('role:super_admin,administrator,building_admin');
    Route::get('/disputes', [AdminDomainController::class, 'disputes'])
        ->middleware('role:super_admin,administrator,moderator,finance_admin,platform_ops,orders_admin,refund_agent');
    Route::put('/disputes/{id}', [AdminDomainController::class, 'updateDispute'])
        ->middleware('role:super_admin,administrator,moderator,finance_admin,platform_ops,orders_admin,refund_agent');
    Route::get('/refunds', [AdminDomainController::class, 'refunds'])
        ->middleware('role:super_admin,administrator,moderator,finance_admin,platform_ops,orders_admin,refund_agent');
    // Gap 3 support review queue: approve (same-method payout) / reject.
    Route::put('/refunds/{id}', [AdminDomainController::class, 'decideRefund'])
        ->middleware('role:super_admin,administrator,moderator,finance_admin,platform_ops,orders_admin,refund_agent');
    Route::get('/subscriptions', [AdminDomainController::class, 'subscriptions'])
        ->middleware('role:super_admin,administrator');
    Route::get('/wallet/transactions', [AdminDomainController::class, 'walletTransactions'])
        ->middleware('role:super_admin,administrator,finance_admin,wallet_admin');
    Route::get('/notifications', [AdminDomainController::class, 'notifications'])
        ->middleware('role:super_admin,administrator');
    Route::get('/properties', [AdminDomainController::class, 'properties'])
        ->middleware('role:super_admin,administrator,building_admin,real_estate_admin');
    Route::put('/properties/{id}', [AdminDomainController::class, 'updateProperty'])
        ->middleware('role:super_admin,administrator,building_admin,real_estate_admin');
    Route::delete('/reviews/{id}', [AdminDomainController::class, 'destroyReview'])
        ->middleware('role:super_admin,administrator,moderator');

    // RMA return queue (approve issues the gateway refund via RefundPayment)
    Route::get('/returns', [\Modules\Orders\Http\Controllers\ReturnRequestController::class, 'adminIndex'])
        ->middleware('role:super_admin,administrator,moderator,finance_admin,platform_ops,orders_admin,refund_agent');
    Route::put('/returns/{id}', [\Modules\Orders\Http\Controllers\ReturnRequestController::class, 'decide'])
        ->middleware('role:super_admin,administrator,moderator,finance_admin,platform_ops,orders_admin,refund_agent');


    // Needs moderation console (P0 admin needs console)
    Route::prefix('needs')->middleware('permission:needs.overview.view')->group(function () {
        // Overview (§28 operational metrics).
        Route::get('/overview', [AdminNeedsController::class, 'overview']);

        // Reports (§35) + audited export.
        Route::get('/reports/requests', [AdminNeedsController::class, 'reportsRequests'])
            ->middleware('permission:needs.reports.view');
        Route::get('/reports/requests/export', [AdminNeedsController::class, 'exportRequests'])
            ->middleware('permission:needs.reports.export');

        // Requests
        Route::get('/requests', [AdminNeedsController::class, 'requestsIndex'])
            ->middleware('permission:needs.requests.view');
        Route::get('/requests/{id}', [AdminNeedsController::class, 'requestsShow'])
            ->middleware('permission:needs.requests.view');
        Route::post('/requests/{id}/moderate', [AdminNeedsController::class, 'requestsModerate'])
            ->middleware('permission:needs.requests.moderate');

        // Offers
        Route::get('/offers', [AdminNeedsController::class, 'offersIndex'])
            ->middleware('permission:needs.offers.view');
        Route::delete('/offers/{id}', [AdminNeedsController::class, 'offersDestroy'])
            ->middleware('permission:needs.offers.moderate');

        // Tasks
        Route::get('/tasks', [AdminNeedsController::class, 'tasksIndex'])
            ->middleware('permission:needs.tasks.view');
        Route::post('/tasks/{id}/cancel', [AdminNeedsController::class, 'tasksCancel'])
            ->middleware('permission:needs.tasks.manage');
        Route::post('/tasks/{id}/restore', [AdminNeedsController::class, 'tasksRestore'])
            ->middleware('permission:needs.tasks.manage');
        Route::get('/tasks/{id}/applications', [AdminNeedsController::class, 'tasksApplications'])
            ->middleware('permission:needs.tasks.view');

        // Providers (TODO 08: approval / suspension review queue)
        Route::get('/providers', [AdminNeedsController::class, 'providersIndex'])
            ->middleware('permission:needs.providers.view');
        Route::get('/providers/{id}', [AdminNeedsController::class, 'providersShow'])
            ->middleware('permission:needs.providers.view');
        Route::post('/providers/{id}/review', [AdminNeedsController::class, 'providersReview'])
            ->middleware('permission:needs.providers.review');
        Route::post('/providers/{id}/suspend', [AdminNeedsController::class, 'providersSuspend'])
            ->middleware('permission:needs.providers.manage');
        Route::post('/providers/{id}/reinstate', [AdminNeedsController::class, 'providersReinstate'])
            ->middleware('permission:needs.providers.manage');

        // Listings (TODO 09: approval → publication moderation)
        Route::get('/listings', [AdminNeedsController::class, 'listingsIndex'])
            ->middleware('permission:needs.listings.view');
        Route::post('/listings/{id}/moderate', [AdminNeedsController::class, 'listingsModerate'])
            ->middleware('permission:needs.listings.review');

        // Categories (TODO 05: hierarchy + visibility + question schemas)
        Route::get('/categories', [AdminNeedsController::class, 'categoriesIndex']);
        Route::post('/categories', [AdminNeedsController::class, 'categoriesStore'])
            ->middleware('permission:needs.overview.manage');
        Route::put('/categories/{id}', [AdminNeedsController::class, 'categoriesUpdate'])
            ->middleware('permission:needs.overview.manage');
        Route::delete('/categories/{id}', [AdminNeedsController::class, 'categoriesDestroy'])
            ->middleware('permission:needs.overview.manage');

        // N-29 cost guides (admin CRUD; reuse needs.listings.* permissions)
        Route::get('/cost-guides', [\Modules\Admin\Http\Controllers\AdminCostGuideController::class, 'index'])
            ->middleware('permission:needs.listings.view');
        Route::post('/cost-guides', [\Modules\Admin\Http\Controllers\AdminCostGuideController::class, 'store'])
            ->middleware('permission:needs.listings.manage');
        Route::put('/cost-guides/{id}', [\Modules\Admin\Http\Controllers\AdminCostGuideController::class, 'update'])
            ->middleware('permission:needs.listings.manage');
        Route::delete('/cost-guides/{id}', [\Modules\Admin\Http\Controllers\AdminCostGuideController::class, 'destroy'])
            ->middleware('permission:needs.listings.manage');

        // Disputes (needs-scoped)
        Route::get('/disputes', [AdminNeedsController::class, 'disputesIndex'])
            ->middleware('permission:needs.disputes.view');
        Route::get('/disputes/{id}', [AdminNeedsController::class, 'disputesShow'])
            ->middleware('permission:needs.disputes.view');
        Route::post('/disputes/{id}/assign', [AdminNeedsController::class, 'disputesAssign'])
            ->middleware('permission:needs.disputes.manage');
        Route::post('/disputes/{id}/resolve', [AdminNeedsController::class, 'disputesResolve'])
            ->middleware('permission:needs.disputes.manage');

        // Fraud flags
        Route::get('/fraud-flags', [AdminNeedsController::class, 'fraudFlagsIndex'])
            ->middleware('permission:needs.fraud.view');
        Route::post('/fraud-flags/{id}/decide', [AdminNeedsController::class, 'fraudFlagsDecide'])
            ->middleware('permission:needs.fraud.manage');
        Route::post('/fraud-scan', [AdminNeedsController::class, 'fraudScan'])
            ->middleware('permission:needs.fraud.manage');
    });

    // Generic approval engine (W4) — gate mirrors the /admin/approvals page
    // role group; per-step approver roles are enforced inside the engine.
    Route::get('/approval-requests', [\Modules\Admin\Http\Controllers\AdminApprovalRequestController::class, 'index'])
        ->middleware('permission:products.products.approve');
    Route::post('/approval-requests', [\Modules\Admin\Http\Controllers\AdminApprovalRequestController::class, 'store'])
        ->middleware('permission:products.products.approve');
    Route::get('/approval-requests/{id}', [\Modules\Admin\Http\Controllers\AdminApprovalRequestController::class, 'show'])
        ->middleware('permission:products.products.approve');
    Route::post('/approval-requests/{id}/approve', [\Modules\Admin\Http\Controllers\AdminApprovalRequestController::class, 'approve'])
        ->middleware('permission:products.products.approve');
    Route::post('/approval-requests/{id}/reject', [\Modules\Admin\Http\Controllers\AdminApprovalRequestController::class, 'reject'])
        ->middleware('permission:products.products.approve');
});
