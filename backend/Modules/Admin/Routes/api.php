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
use Modules\Admin\Http\Controllers\AdminCmsController;
use Modules\Admin\Http\Controllers\AdminSupportController;
use Modules\Admin\Http\Controllers\AdminRbacController;
use Modules\Admin\Http\Controllers\AdminProductApprovalController;
use Modules\Admin\Http\Controllers\AdminDepartmentController;

/*
|--------------------------------------------------------------------------
| Admin Module API Routes
|--------------------------------------------------------------------------
*/

Route::prefix('api/admin')->middleware(['api', 'auth:sanctum', 'role:super_admin,administrator'])->group(function () {

    // Dashboard stats
    Route::get('/stats', [AdminStatsController::class, 'index'])
        ->can('viewDashboard');
    Route::get('/stats/system', [AdminStatsController::class, 'system'])
        ->can('manageSettings');

    // User management
    Route::get('/users', [AdminUserController::class, 'index'])
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

    // Analytics
    Route::get('/analytics/overview', [AdminAnalyticsController::class, 'overview'])
        ->can('viewDashboard');
    Route::get('/analytics/user-growth', [AdminAnalyticsController::class, 'userGrowth'])
        ->can('viewDashboard');
    Route::get('/analytics/revenue', [AdminAnalyticsController::class, 'revenue'])
        ->can('viewDashboard');
    Route::get('/analytics/categories', [AdminAnalyticsController::class, 'categories'])
        ->can('viewDashboard');
    Route::get('/analytics/traffic', [AdminAnalyticsController::class, 'traffic'])
        ->can('viewDashboard');

    // CMS management
    Route::get('/cms/pages', [AdminCmsController::class, 'pages'])
        ->can('manageCms');
    Route::post('/cms/pages', [AdminCmsController::class, 'createPage'])
        ->can('manageCms');
    Route::delete('/cms/pages/{id}', [AdminCmsController::class, 'deletePage'])
        ->can('manageCms');
    Route::get('/cms/blog', [AdminCmsController::class, 'blog'])
        ->can('manageCms');
    Route::post('/cms/blog', [AdminCmsController::class, 'createBlog'])
        ->can('manageCms');
    Route::delete('/cms/blog/{id}', [AdminCmsController::class, 'deleteBlog'])
        ->can('manageCms');
    Route::get('/cms/banners', [AdminCmsController::class, 'banners'])
        ->can('manageCms');
    Route::post('/cms/banners', [AdminCmsController::class, 'createBanner'])
        ->can('manageCms');
    Route::delete('/cms/banners/{id}', [AdminCmsController::class, 'deleteBanner'])
        ->can('manageCms');
    Route::get('/cms/announcements', [AdminCmsController::class, 'announcements'])
        ->can('manageCms');
    Route::post('/cms/announcements', [AdminCmsController::class, 'createAnnouncement'])
        ->can('manageCms');
    Route::delete('/cms/announcements/{id}', [AdminCmsController::class, 'deleteAnnouncement'])
        ->can('manageCms');

    // Support tickets
    Route::get('/support/tickets', [AdminSupportController::class, 'tickets'])
        ->can('manageSupport');
    Route::patch('/support/tickets/{id}/assign', [AdminSupportController::class, 'assign'])
        ->can('manageSupport');

    // Audit logs
    Route::get('/audit-logs', [AdminAuditController::class, 'index'])
        ->can('viewAuditLogs');

    // System settings & feature flags
    Route::get('/settings', [AdminSettingsController::class, 'index'])
        ->can('manageSettings');
    Route::put('/settings', [AdminSettingsController::class, 'update'])
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
        ->middleware('role:super_admin,administrator,category_admin');
    Route::post('/products/{id}/approve', [AdminProductApprovalController::class, 'approve'])
        ->middleware('role:super_admin,administrator,category_admin');
    Route::post('/products/{id}/reject', [AdminProductApprovalController::class, 'reject'])
        ->middleware('role:super_admin,administrator,category_admin');

    // Departments (shared by support + healthcare)
    Route::get('/departments', [AdminDepartmentController::class, 'index'])
        ->middleware('role:super_admin,administrator,customer_service,support_staff');
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
    Route::put('/roles/assign', [AdminRbacController::class, 'updateRole'])
        ->can('manageUsers');
});
