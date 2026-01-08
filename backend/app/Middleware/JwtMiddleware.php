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
            
            // Session Validation (JTI check)
            if (isset($decoded->jti)) {
                $session = \App\Models\CustomerSession::where('session_token', $decoded->jti)->first();
                if (!$session) {
                    return ResponseFormatter::error(new SlimResponse(), 'Unauthorized: Session expired or invalid', 401);
                }
                
                // Update last active timestamp (optional optimization: only update if > 5 mins old)
                $session->last_active = date('Y-m-d H:i:s');
                $session->save();
            }

            // Scope Check for Restricted Tokens
            if (isset($decoded->scope) && $decoded->scope === 'manage_devices') {
                $path = $request->getUri()->getPath();
                // Allow only session management endpoints
                $allowedPaths = [
                    '/api/customers/sessions',
                    '/api/customers/logout'
                ];
                
                $isAllowed = false;
                foreach ($allowedPaths as $allowed) {
                    if (strpos($path, $allowed) !== false) {
                        $isAllowed = true;
                        break;
                    }
                }

                if (!$isAllowed) {
                    return ResponseFormatter::error(new SlimResponse(), 'Forbidden: Restricted access. Please manage devices.', 403, ['error' => 'device_limit_reached']);
                }
            }

            $request = $request->withAttribute('user', $decoded);
        } catch (\Exception $e) {
            return ResponseFormatter::error(new SlimResponse(), 'Unauthorized: Invalid token', 401);
        }

        return $handler->handle($request);
    }
}
