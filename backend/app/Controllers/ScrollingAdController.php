<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\ScrollingAd;
use App\Helpers\ResponseFormatter;

class ScrollingAdController
{
    public function index(Request $request, Response $response): Response
    {
        $ads = ScrollingAd::where('status', 'active')
            ->orderBy('created_at', 'desc')
            ->get();
            
        return ResponseFormatter::success($response, $ads, 'Active scrolling ads retrieved successfully');
    }
}
