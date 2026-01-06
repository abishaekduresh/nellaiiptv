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
        $group->delete('/channels/{uuid}', [\App\Controllers\Admin\ChannelController::class, 'delete']);
        
        // Customer Management
        $group->get('/customers', [\App\Controllers\Admin\CustomerController::class, 'index']);
        $group->put('/customers/{uuid}', [\App\Controllers\Admin\CustomerController::class, 'update']);
        $group->delete('/customers/{uuid}', [\App\Controllers\Admin\CustomerController::class, 'delete']);
        
        // Settings Management
        $group->get('/settings', [\App\Controllers\Admin\SettingController::class, 'index']);
        $group->put('/settings/{key}', [\App\Controllers\Admin\SettingController::class, 'update']);
        
        // Dashboard Stats
        $group->get('/dashboard/stats', [\App\Controllers\Admin\DashboardController::class, 'getStats']);
        
    })->add(new \App\Middleware\AdminAuthMiddleware());
});
