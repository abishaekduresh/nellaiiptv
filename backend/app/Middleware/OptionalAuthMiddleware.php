<?php

namespace App\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Firebase\JWT\JWT;

class OptionalAuthMiddleware implements MiddlewareInterface
{
    public function process(Request $request, RequestHandler $handler): Response
    {
        $authHeader = $request->getHeaderLine('Authorization');
        $arr = explode(' ', $authHeader);
        $token = $arr[1] ?? '';

        if ($token) {
            try {
                // If token exists, try to decode it
                // We don't want to fail if it's invalid (just treat as guest), or maybe we do?
                // If token is sent but invalid, client might be confused. 
                // But for "Optional", usually we just ignore errors or log them.
                // However, if it's invalid, it might be better to return 401 so frontend knows to refresh?
                // But this breaks "Public" access if token is stale.
                // Safer: Just try to decode. If fail, continue as guest.
                
                $decoded = JWT::decode($token, $_ENV['JWT_SECRET'], ['HS256']);
                
                // Session Check (optional for optional auth? maybe yes to be consistent)
                if (isset($decoded->jti)) {
                    $session = \App\Models\CustomerSession::where('session_token', $decoded->jti)->first();
                    if ($session) {
                        $request = $request->withAttribute('user', $decoded);
                    }
                } else {
                     // No JTI, just trust token (if legacy) or ignore
                     $request = $request->withAttribute('user', $decoded);
                }

            } catch (\Exception $e) {
                // Token invalid or expired.
                // Ignore and proceed as guest.
            }
        }

        return $handler->handle($request);
    }
}
