<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Helpers\ResponseFormatter;
use Illuminate\Database\Capsule\Manager as DB;

class SystemController
{
    public function health(Request $request, Response $response): Response
    {
        try {
            // Test database connectivity
            $dbStatus = 'connected';
            $dbError = null;
            
            try {
                DB::connection()->getPdo();
                $channelCount = DB::table('channels')->count();
            } catch (\Exception $dbException) {
                $dbStatus = 'disconnected';
                $dbError = $dbException->getMessage();
                
                // Log detailed database error to console
                error_log("=== HEALTH CHECK DATABASE ERROR ===");
                error_log("Error: " . $dbException->getMessage());
                error_log("Code: " . $dbException->getCode());
                error_log("File: " . $dbException->getFile() . ":" . $dbException->getLine());
                error_log("Trace: " . $dbException->getTraceAsString());
                error_log("===================================");
            }
            
            $healthData = [
                'status' => $dbStatus === 'connected' ? 'healthy' : 'degraded',
                'timestamp' => date('c'),
                'service' => 'Nellai IPTV Backend',
                'database' => [
                    'status' => $dbStatus,
                    'channels_count' => $channelCount ?? 0,
                    'error' => $dbError
                ],
                'php_version' => PHP_VERSION,
                'memory_usage' => round(memory_get_usage(true) / 1024 / 1024, 2) . ' MB'
            ];
            
            // Log health check to console
            error_log("=== HEALTH CHECK ===");
            error_log("Status: " . $healthData['status']);
            error_log("Database: " . $dbStatus);
            if ($dbError) {
                error_log("DB Error: " . $dbError);
            }
            error_log("===================");
            
            return ResponseFormatter::success($response, $healthData, 'Health check completed');
            
        } catch (\Exception $e) {
            // Log critical error to console
            error_log("=== CRITICAL HEALTH CHECK ERROR ===");
            error_log("Error: " . $e->getMessage());
            error_log("Code: " . $e->getCode());
            error_log("File: " . $e->getFile() . ":" . $e->getLine());
            error_log("Trace: " . $e->getTraceAsString());
            error_log("===================================");
            
            return ResponseFormatter::error($response, 'Health check failed: ' . $e->getMessage(), 500);
        }
    }
}
