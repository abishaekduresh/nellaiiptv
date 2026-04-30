<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Helpers\ResponseFormatter;
use Illuminate\Database\Capsule\Manager as Capsule;
use Throwable;

class SystemController
{
    public function health(Request $request, Response $response): Response
    {
        try {
            // Check Database Connection
            Capsule::connection()->getPdo();

            return ResponseFormatter::success($response, [
                'status' => 'healthy',
                'timestamp' => date('c'),
                'service' => 'Nellai IPTV Backend',
                'database' => 'connected'
            ], 'System is healthy');
        } catch (Throwable $e) {
            // Log the actual error for debugging if needed, but return a safe message
            error_log('Database connection failed in health check: ' . $e->getMessage());
            return ResponseFormatter::error($response, 'Database connection failed. Please check your database settings and ensure the database server is running.', 503);
        }
    }
}
