<?php

// 1. CORS Headers (Early Exit for Preflight)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
// Validate origin if needed, or allow all for dev
header("Access-Control-Allow-Origin: " . ($origin ?: '*')); 
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-API-KEY, X-Client-Platform, X-Device-Id');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

/**
 * 2. Bootstrap the Application
 */
$rootDir = dirname(__DIR__);
require $rootDir . '/vendor/autoload.php';
$app = require $rootDir . '/bootstrap/app.php';

use Slim\Exception\HttpNotFoundException;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * 3. SELF-CORRECTING BASE PATH
 * This logic handles root-level rewrites common in cPanel/shared hosting.
 */
$scriptName = $_SERVER['SCRIPT_NAME']; // e.g. /public/index.php
$requestUri = $_SERVER['REQUEST_URI']; // e.g. /api/health

// Calculate base path by stripping index.php and optionally /public
$basePath = str_replace('/index.php', '', $scriptName);
$basePath = rtrim($basePath, '/');

// On server root, basePath MUST be an empty string
if (empty($basePath) || $basePath === '/' || $basePath === '.') {
    $basePath = '';
}

$app->setBasePath($basePath);

/**
 * 4. Load App Routes
 */
require $rootDir . '/app/Routes/api.php';
require $rootDir . '/app/Routes/admin.php';

/**
 * 5. Middleware Stack
 */
// Security Middleware
$app->add(new \App\Middleware\SecurityHeadersMiddleware());
$app->add(new \App\Middleware\RateLimitMiddleware(500, 60)); // 1000 reqs/min global
$app->add(new \App\Middleware\ApiKeyMiddleware());
$app->add(new \App\Middleware\PlatformMiddleware());
$app->add(new \App\Middleware\CorsMiddleware()); // Must run first (added last to wrap everything)

// Routing Middleware (Must run BEFORE Security/Cors to provide RouteContext)
// In Slim LIFO, "Last Added" = "First Executed".
// So we add RoutingMiddleware LAST.
$app->addRoutingMiddleware();

// Method Override Middleware (Parses _method, MUST run before Routing but after BodyParsing)
$app->add(new \Slim\Middleware\MethodOverrideMiddleware());

// Body Parsing Middleware
$app->addBodyParsingMiddleware();

/**
 * 6. CUSTOM ERROR HANDLER (Diagnostic Mode)
 * If a route is not found, it returns the server variables so we can see the path mismatch.
 */
$errorMiddleware = $app->addErrorMiddleware(true, true, true);
$errorMiddleware->setErrorHandler(HttpNotFoundException::class, function (Request $request) use ($basePath) {
    $response = new \Slim\Psr7\Response();
    $data = [
        'status' => false,
        'message' => 'Endpoint not found',
    ];

    if (($_ENV['APP_DEBUG'] ?? 'false') == 'true') {
        $data['diagnostics'] = [
            'request_path' => $request->getUri()->getPath(),
            'detected_base_path' => $basePath ?: '(root)',
            'script_name' => $_SERVER['SCRIPT_NAME'],
            'request_uri' => $_SERVER['REQUEST_URI'],
            'hint' => 'Check if the URL should be ' . $basePath . '/api/health'
        ];
    }

    $response->getBody()->write(json_encode($data));
    return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
});

$app->run();