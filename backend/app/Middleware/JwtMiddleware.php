<?php

namespace App\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Firebase\JWT\JWT;
use App\Helpers\ResponseFormatter;
use Slim\Psr7\Response as SlimResponse;

class JwtMiddleware implements MiddlewareInterface
{
    public function process(Request $request, RequestHandler $handler): Response
    {
        $authHeader = $request->getHeaderLine('Authorization');
        $arr = explode(' ', $authHeader);
        $token = $arr[1] ?? '';

        if (!$token) {
            return ResponseFormatter::error(new SlimResponse(), 'Unauthorized: No token provided', 401);
        }

        try {
            $decoded = JWT::decode($token, $_ENV['JWT_SECRET'], ['HS256']);
            $request = $request->withAttribute('user', $decoded);
        } catch (\Exception $e) {
            return ResponseFormatter::error(new SlimResponse(), 'Unauthorized: Invalid token', 401);
        }

        return $handler->handle($request);
    }
}
