<?php

namespace App\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use App\Helpers\ResponseFormatter;
use Slim\Psr7\Response as SlimResponse;

class PlatformMiddleware implements MiddlewareInterface
{
    private const ALLOWED_PLATFORMS = ['web', 'android', 'ios', 'tv'];

    public function process(Request $request, RequestHandler $handler): Response
    {
        // Skip for OPTIONS requests (CORS preflight)
        if ($request->getMethod() === 'OPTIONS') {
            return $handler->handle($request);
        }

        $platform = $request->getHeaderLine('X-Client-Platform');

        if (empty($platform)) {
             return ResponseFormatter::error(new SlimResponse(), 'Missing Required Header: Platform', 400);
        }

        if (!in_array(strtolower($platform), self::ALLOWED_PLATFORMS)) {
            return ResponseFormatter::error(new SlimResponse(), 'Invalid Platform. Allowed: ' . implode(', ', self::ALLOWED_PLATFORMS), 400);
        }

        return $handler->handle($request);
    }
}
