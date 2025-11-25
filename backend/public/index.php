<?php

// Handle CORS preflight requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

use Slim\Factory\AppFactory;
use App\Middleware\JsonBodyParserMiddleware;
use App\Middleware\CorsMiddleware;
use App\Middleware\ErrorHandlerMiddleware;

$app = require __DIR__ . '/../bootstrap/app.php';
$basePath = (strpos($_SERVER['REQUEST_URI'], '/public') === 0) ? '/public' : '';
$app->setBasePath($basePath);

// Custom Middleware
$app->add(new CorsMiddleware()); 
$app->add(new JsonBodyParserMiddleware());

// Routing Middleware (Must run before Cors)
$app->addRoutingMiddleware();

// Body Parsing Middleware
$app->addBodyParsingMiddleware();

// Error Middleware
$app->add(new ErrorHandlerMiddleware());
$errorMiddleware = $app->addErrorMiddleware($_ENV['APP_DEBUG'] === 'true', true, true);

// Routes
require __DIR__ . '/../app/Routes/api.php';
require __DIR__ . '/../app/Routes/admin.php';

$app->run();
