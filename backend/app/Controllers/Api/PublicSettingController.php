<?php

namespace App\Controllers\Api;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\Setting;
use App\Helpers\ResponseFormatter;

class PublicSettingController
{
    public function getPublicSettings(Request $request, Response $response): Response
    {
        // Expose only safe settings
        $logoUrl = Setting::get('logo_url', '/logo.jpg');
        
        // Ensure full URL if it's a relative path? 
        // Frontend handles it if it starts with /
        if (!$logoUrl) $logoUrl = '/logo.jpg';

        return ResponseFormatter::success($response, [
            'logo_url' => $logoUrl
        ]);
    }
}
