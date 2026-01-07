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
        $logoPath = Setting::get('logo_url', '/logo.jpg');
        $logoUrl = $logoPath;

        try {
            if (strpos($logoPath, '/uploads/') === 0) {
                $uri = $request->getUri();
                $basePath = $uri->getBasePath();
                $scheme = $uri->getScheme();
                $authority = $uri->getAuthority();
                $base = ($basePath === '/' || $basePath === '') ? '' : $basePath;
                
                $logoUrl = $scheme . '://' . $authority . $base . $logoPath;
            }
        } catch (\Throwable $e) {
            // Fallback to relative path if absolute URL generation fails
            $logoUrl = $logoPath;
        }

        if (!$logoUrl) $logoUrl = '/logo.jpg';

        return ResponseFormatter::success($response, [
            'logo_url' => $logoUrl
        ]);
    }
}
