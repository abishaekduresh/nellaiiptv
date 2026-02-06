<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Helpers\ResponseFormatter;

class SystemController
{
    public function health(Request $request, Response $response): Response
    {
        return ResponseFormatter::success($response, [
            'status' => 'healthy',
            'timestamp' => date('c'),
            'service' => 'Nellai IPTV Backend'
        ], 'System is healthy');
    }
}
