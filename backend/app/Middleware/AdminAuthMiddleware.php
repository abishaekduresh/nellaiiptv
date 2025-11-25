<?php

namespace App\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Firebase\JWT\JWT;
use App\Helpers\ResponseFormatter;
use Slim\Psr7\Response as SlimResponse;

class AdminAuthMiddleware implements MiddlewareInterface
{
    public function process(Request $request, RequestHandler $handler): Response
    {
        $authHeader = $request->getHeaderLine('Authorization');

        if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return ResponseFormatter::error(new SlimResponse(), 'Unauthorized: No token provided', 401);
        }

        $token = $matches[1];

        try {
            $decoded = JWT::decode($token, $_ENV['JWT_SECRET'], ['HS256']);
            
            // Check if token is for admin
            if (!isset($decoded->type) || $decoded->type !== 'admin') {
                return ResponseFormatter::error(new SlimResponse(), 'Unauthorized: Invalid token type', 401);
            }

            // Check if user has admin role
            if (!isset($decoded->role) || !in_array($decoded->role, ['super_admin', 'admin', 'moderator'])) {
                return ResponseFormatter::error(new SlimResponse(), 'Forbidden: Insufficient permissions', 403);
            }

            $request = $request->withAttribute('user', $decoded);
        } catch (\Exception $e) {
            return ResponseFormatter::error(new SlimResponse(), 'Unauthorized: Invalid token', 401);
        }

        return $handler->handle($request);
    }
}
