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

        $apiKey = $request->getHeaderLine('X-API-KEY');

        // 1. Check Master Key (Environment Secret)
        if (!empty($this->apiSecret) && $apiKey === $this->apiSecret) {
            return $handler->handle($request);
        }

        // 2. Check Database Keys
        // Lazy load model to avoid DB hit on OPTION or missing key if secret matched (optimized above)
        if (!empty($apiKey)) {
            $keyRecord = \App\Models\ApiKey::where('key_string', $apiKey)
                ->where('status', 'active')
                ->first();

            if ($keyRecord) {
                // Check Expiry
                if ($keyRecord->expires_at && $keyRecord->expires_at < date('Y-m-d H:i:s')) {
                     return ResponseFormatter::error(new SlimResponse(), 'Unauthorized: API Key Expired', 401);
                }

                // Valid Key - Update Last Used (Async usually, but direct for now)
                $keyRecord->last_used_at = date('Y-m-d H:i:s');
                $keyRecord->save();

                return $handler->handle($request);
            }
        }

        return ResponseFormatter::error(new SlimResponse(), 'Unauthorized: Invalid API Key', 401);
    }
}
