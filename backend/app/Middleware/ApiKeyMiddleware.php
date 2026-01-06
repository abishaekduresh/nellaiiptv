<?php

namespace App\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use App\Helpers\ResponseFormatter;
use Slim\Psr7\Response as SlimResponse;

class ApiKeyMiddleware implements MiddlewareInterface
{
    private string $apiSecret;

    public function __construct()
    {
        $this->apiSecret = $_ENV['API_SECRET'] ?? '';
    }

    public function process(Request $request, RequestHandler $handler): Response
    {
        // Skip for OPTION requests (CORS preflight)
        if ($request->getMethod() === 'OPTIONS') {
            return $handler->handle($request);
        }

        // Allow public/health endpoints if needed, but for now we enforce key on all api routes
        // You might want to allow some public assets or root path without key, but strictly speaking "api" should have it.
        
        $apiKey = $request->getHeaderLine('X-API-KEY');

        if (empty($this->apiSecret)) {
            error_log('Warning: API_SECRET is not set in .env');
            return $handler->handle($request); // Fail open or closed? Better warn and proceed or fail? Proceed for now to avoid breaking if config missing, but log error.
        }

        if ($apiKey !== $this->apiSecret) {
            return ResponseFormatter::error(new SlimResponse(), 'Unauthorized: Invalid API Key', 401);
        }

        return $handler->handle($request);
    }
}
