<?php

namespace App\Controllers\Admin;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\Channel;
use App\Models\Customer;
use App\Helpers\ResponseFormatter;

class DashboardController
{
    public function getStats(Request $request, Response $response): Response
    {
        $stats = [
            'total_channels' => Channel::count(),
            'active_channels' => Channel::where('status', 'active')->count(),
            'total_customers' => Customer::count(),
            'active_customers' => Customer::where('status', 'active')->count(),
        ];

        return ResponseFormatter::success($response, $stats);
    }
}
