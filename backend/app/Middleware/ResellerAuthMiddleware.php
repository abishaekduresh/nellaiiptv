<?php

namespace App\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use App\Models\Customer;
use Slim\Psr7\Response as SlimResponse;

class ResellerAuthMiddleware implements MiddlewareInterface
{
    public function process(Request $request, RequestHandler $handler): Response
    {
        // 1. Check if user is authenticated (JwtMiddleware should have run first)
        $user = $request->getAttribute('user');

        if (!$user) {
             return $this->errorResponse('Unauthorized', 401);
        }

        // 2. Check Role
        $customer = Customer::where('uuid', $user->sub)->first();

        if (!$customer || $customer->role !== 'reseller') {
             return $this->errorResponse('Forbidden: Resellers only', 403);
        }
        
        // 3. Status Check (Optional but good)
        if ($customer->status !== 'active') {
             return $this->errorResponse('Account is not active', 403);
        }

        return $handler->handle($request);
    }
    
    private function errorResponse(string $message, int $status): Response
    {
        $response = new SlimResponse();
        $response->getBody()->write(json_encode([
            'status' => 'error',
            'message' => $message
        ]));
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($status);
    }
}
