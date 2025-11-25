<?php

namespace App\Helpers;

use Psr\Http\Message\ResponseInterface as Response;

class ResponseFormatter
{
    public static function success(Response $response, $data = null, string $message = 'Success', int $status = 200): Response
    {
        $payload = [
            'status' => true,
            'message' => $message,
            'data' => $data,
        ];

        $response->getBody()->write(json_encode($payload));
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($status);
    }

    public static function error(Response $response, string $message = 'Error', int $status = 400, $errors = null): Response
    {
        $payload = [
            'status' => false,
            'message' => $message,
        ];

        if ($errors) {
            $payload['errors'] = $errors;
        }

        $response->getBody()->write(json_encode($payload));
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($status);
    }
}
