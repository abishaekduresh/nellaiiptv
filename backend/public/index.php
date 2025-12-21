<?php

// 1. CORS Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
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
 * 3. 🚀 SELF-CORRECTING BASE PATH
 * This logic handles root-level rewrites common in cPanel/shared hosting.
 */
$scriptName = $_SERVER['SCRIPT_NAME']; // e.g. /public/index.php
$requestUri = $_SERVER['REQUEST_URI']; // e.g. /api/health

// Calculate base path by stripping index.php and optionally /public
$basePath = str_replace(['/public/index.php', '/index.php'], '', $scriptName);
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
$app->addRoutingMiddleware();
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
        'diagnostics' => [
            'request_path' => $request->getUri()->getPath(),
            'detected_base_path' => $basePath ?: '(root)',
            'script_name' => $_SERVER['SCRIPT_NAME'],
            'request_uri' => $_SERVER['REQUEST_URI'],
            'hint' => 'Check if the URL should be ' . $basePath . '/api/health'
        ]
    ];
    $response->getBody()->write(json_encode($data));
    return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
});

$app->run();