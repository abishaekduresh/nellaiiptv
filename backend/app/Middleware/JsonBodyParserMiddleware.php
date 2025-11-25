<?php

namespace App\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;

class JsonBodyParserMiddleware implements MiddlewareInterface
{
    public function process(Request $request, RequestHandler $handler): Response
    {
        $contentType = $request->getHeaderLine('Content-Type');

        if (strpos($contentType, 'application/json') !== false) {
            $contents = file_get_contents('php://input');
            $parsedBody = json_decode($contents, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $request = $request->withParsedBody($parsedBody);
            }
        }

        return $handler->handle($request);
    }
}
