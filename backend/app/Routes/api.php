<?php

use Slim\Routing\RouteCollectorProxy;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

$app->get('/', function (Request $request, Response $response) {
    $response->getBody()->write(json_encode(['status' => 'ok', 'message' => 'Nellai IPTV API is running']));
    return $response->withHeader('Content-Type', 'application/json');
});

$app->group('/api', function (RouteCollectorProxy $group) {
    
    // System
    $group->get('/health', [\App\Controllers\SystemController::class, 'health']);

    // Auth
    $group->post('/customers/register', [\App\Controllers\AuthController::class, 'register']);
    $group->post('/customers/login', [\App\Controllers\AuthController::class, 'login']);
    $group->post('/customers/forgot-password', [\App\Controllers\AuthController::class, 'forgotPassword']);
    $group->post('/customers/reset-password', [\App\Controllers\AuthController::class, 'resetPassword']);
    
    // Webhooks
    $group->post('/webhooks/resend', [\App\Controllers\WebhookController::class, 'handleResend']);
    
    // Protected Routes
    $group->group('', function (RouteCollectorProxy $group) {
        $group->post('/customers/refresh-token', [\App\Controllers\AuthController::class, 'refreshToken']);
        
        // Customer Profile
        $group->get('/customers/profile', [\App\Controllers\CustomerController::class, 'getProfile']);
        $group->put('/customers/profile', [\App\Controllers\CustomerController::class, 'updateProfile']);
        $group->delete('/customers', [\App\Controllers\CustomerController::class, 'delete']);
        $group->post('/customers/logout', [\App\Controllers\AuthController::class, 'logout']);

        // Device Sessions
        $group->get('/customers/sessions', [\App\Controllers\AuthController::class, 'getSessions']);
        $group->delete('/customers/sessions/{id}', [\App\Controllers\AuthController::class, 'revokeSession']);

        // Channels Actions
        $group->post('/channels/{uuid}/rate', [\App\Controllers\ChannelController::class, 'rate']);
        $group->post('/channels/{uuid}/comments', [\App\Controllers\ChannelController::class, 'addComment']);

        // Favorites
        $group->get('/customers/favorites', [\App\Controllers\FavoriteController::class, 'index']);
        $group->get('/customers/favorites/ids', [\App\Controllers\FavoriteController::class, 'getIds']);
        $group->post('/customers/favorites/toggle', [\App\Controllers\FavoriteController::class, 'toggle']);
    })->add(new \App\Middleware\JwtMiddleware());

    // Search
    $group->get('/channels/search', [\App\Controllers\SearchController::class, 'searchChannels']);

    // Public Channel Routes (Optional Auth)
    $group->group('', function (RouteCollectorProxy $group) {
        $group->get('/channels', [\App\Controllers\ChannelController::class, 'index']);
        $group->get('/channels/featured', [\App\Controllers\ChannelController::class, 'getFeatured']);
        $group->get('/channels/new', [\App\Controllers\ChannelController::class, 'getNew']);
        $group->get('/channels/{uuid}', [\App\Controllers\ChannelController::class, 'show']);
        $group->get('/channels/{uuid}/ratings', [\App\Controllers\ChannelController::class, 'getRatings']);
        $group->get('/channels/{uuid}/comments', [\App\Controllers\ChannelController::class, 'getComments']);
        $group->get('/channels/related/{uuid}', [\App\Controllers\ChannelController::class, 'getRelated']);
    })->add(new \App\Middleware\OptionalAuthMiddleware());
    $group->post('/channels/{uuid}/heartbeat', [\App\Controllers\ChannelController::class, 'heartbeat']);
    $group->post('/channels/{uuid}/view', [\App\Controllers\ChannelController::class, 'incrementView']);

    $group->post('/channels/{uuid}/report', [\App\Controllers\ChannelController::class, 'report']);

    // Ads
    $group->get('/ads', [\App\Controllers\AdController::class, 'index']);
    $group->post('/ads/{uuid}/impression', [\App\Controllers\AdController::class, 'impression']);

    // Geo
    $group->get('/states', [\App\Controllers\GeoController::class, 'getStates']);
    $group->get('/districts', [\App\Controllers\GeoController::class, 'getDistricts']);
    $group->get('/languages', [\App\Controllers\GeoController::class, 'getLanguages']);
    $group->get('/categories', [\App\Controllers\GeoController::class, 'getCategories']);

    // Contact
    $group->post('/contact', [\App\Controllers\ContactController::class, 'submit']);

    // Settings (Public)
    $group->get('/settings/disclaimer', [\App\Controllers\Admin\SettingController::class, 'getDisclaimer']);
    $group->get('/settings/public', [\App\Controllers\Api\PublicSettingController::class, 'getPublicSettings']);

});
