<?php

use Slim\Routing\RouteCollectorProxy;

// Admin Routes (Protected by AdminAuthMiddleware)
$app->group('/api/admin', function (RouteCollectorProxy $group) {
    
    // Admin Authentication
    $group->post('/login', [\App\Controllers\Admin\AdminAuthController::class, 'login']);
    
    // Protected Admin Routes
    $group->group('', function (RouteCollectorProxy $group) {
        // Token Refresh
        $group->post('/refresh-token', [\App\Controllers\Admin\AdminAuthController::class, 'refreshToken']);
        $group->post('/change-password', [\App\Controllers\Admin\AdminAuthController::class, 'changePassword']);
        
        // Channel Management
        $group->get('/channels', [\App\Controllers\Admin\ChannelController::class, 'index']);
        $group->post('/channels', [\App\Controllers\Admin\ChannelController::class, 'create']);
        $group->get('/channels/{uuid}', [\App\Controllers\Admin\ChannelController::class, 'show']);
        $group->put('/channels/{uuid}', [\App\Controllers\Admin\ChannelController::class, 'update']);
        $group->post('/channels/{uuid}', [\App\Controllers\Admin\ChannelController::class, 'update']); // Allow POST for file uploads
        $group->delete('/channels/{uuid}', [\App\Controllers\Admin\ChannelController::class, 'delete']);
        $group->get('/channels/{uuid}/analytics', [\App\Controllers\Admin\ChannelController::class, 'getAnalytics']);
        
        // Customer Management
        $group->get('/customers', [\App\Controllers\Admin\CustomerController::class, 'index']);
        $group->get('/customers/stats', [\App\Controllers\Admin\CustomerController::class, 'getStats']); // Added route
        $group->post('/customers', [\App\Controllers\Admin\CustomerController::class, 'create']);
        $group->get('/customers/{uuid}', [\App\Controllers\Admin\CustomerController::class, 'show']);
        $group->put('/customers/{uuid}', [\App\Controllers\Admin\CustomerController::class, 'update']);
        $group->delete('/customers/{uuid}', [\App\Controllers\Admin\CustomerController::class, 'delete']);
        $group->post('/customers/{uuid}/wallet/topup', [\App\Controllers\Admin\AdminWalletController::class, 'topupWallet']);
        $group->get('/customers/{uuid}/wallet/transactions', [\App\Controllers\Admin\AdminWalletController::class, 'getWalletTransactions']);
        
        // Settings Management
        $group->get('/settings', [\App\Controllers\Admin\SettingController::class, 'index']);
        $group->put('/settings/{key}', [\App\Controllers\Admin\SettingController::class, 'update']);
        $group->post('/settings/logo', [\App\Controllers\Admin\SettingController::class, 'uploadLogo']);
        $group->post('/settings/logo-png', [\App\Controllers\Admin\SettingController::class, 'uploadAppLogoPng']);
        
        // Subscription Plans
        $group->get('/plans', [\App\Controllers\Admin\SubscriptionPlanController::class, 'index']);
        $group->post('/plans', [\App\Controllers\Admin\SubscriptionPlanController::class, 'create']);
        $group->get('/plans/{uuid}', [\App\Controllers\Admin\SubscriptionPlanController::class, 'show']);
        $group->put('/plans/{uuid}', [\App\Controllers\Admin\SubscriptionPlanController::class, 'update']);
        $group->delete('/plans/{uuid}', [\App\Controllers\Admin\SubscriptionPlanController::class, 'delete']);
        
        // Transactions
        $group->get('/transactions', [\App\Controllers\Admin\AdminTransactionController::class, 'index']);
        $group->get('/transactions/unified', [\App\Controllers\Admin\AdminTransactionController::class, 'getUnifiedLogs']);

        // API Keys Management
        $group->get('/api-keys', [\App\Controllers\Admin\ApiKeyController::class, 'index']);
        $group->post('/api-keys', [\App\Controllers\Admin\ApiKeyController::class, 'create']);
        $group->put('/api-keys/{uuid}', [\App\Controllers\Admin\ApiKeyController::class, 'update']);
        $group->delete('/api-keys/{uuid}', [\App\Controllers\Admin\ApiKeyController::class, 'delete']);

        // Contact Messages
        $group->get('/contacts', [\App\Controllers\Admin\ContactController::class, 'index']);
        $group->delete('/contacts/{uuid}', [\App\Controllers\Admin\ContactController::class, 'delete']);

        // Dashboard Stats
        $group->get('/dashboard/stats', [\App\Controllers\Admin\DashboardController::class, 'getStats']);
        $group->get('/dashboard/trending', [\App\Controllers\Admin\DashboardController::class, 'getTrendingStats']);
        
        // Geo Data (for filters)
        $group->get('/categories', [\App\Controllers\GeoController::class, 'getCategories']);
        $group->get('/languages', [\App\Controllers\GeoController::class, 'getLanguages']);
        $group->get('/states', [\App\Controllers\GeoController::class, 'getStates']);
        
    })->add(new \App\Middleware\AdminAuthMiddleware());
});
