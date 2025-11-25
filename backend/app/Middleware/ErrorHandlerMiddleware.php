<?php

namespace App\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Slim\Exception\HttpNotFoundException;
use Slim\Exception\HttpMethodNotAllowedException;
use Throwable;
use App\Helpers\ResponseFormatter;
use Slim\Psr7\Response as SlimResponse;

class ErrorHandlerMiddleware implements MiddlewareInterface
{
    public function process(Request $request, RequestHandler $handler): Response
    {
        try {
            return $handler->handle($request);
        } catch (HttpNotFoundException $e) {
            return ResponseFormatter::error(new SlimResponse(), 'Endpoint not found', 404);
        } catch (HttpMethodNotAllowedException $e) {
            return ResponseFormatter::error(new SlimResponse(), 'Method not allowed', 405);
        } catch (Throwable $e) {
            $response = new SlimResponse();
            $payload = [
                'message' => 'Internal Server Error',
            ];
            
            if ($_ENV['APP_DEBUG'] === 'true') {
                $payload['error'] = $e->getMessage();
                $payload['trace'] = $e->getTraceAsString();
            }

            return ResponseFormatter::error($response, $payload['message'], 500, $payload);
        }
    }
}
