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
        $logoPath = Setting::get('logo_path', '/logo.jpg');
        $maintenanceMode = Setting::get('maintenance_mode', '0');
        $maintenanceTitle = Setting::get('maintenance_title', 'Under Maintenance');
        $maintenanceMessage = Setting::get('maintenance_message', 'We are currently upgrading our system. Please check back later.');

        // Helper to resolve URL
        $resolveUrl = function($path) use ($request) {
            if (empty($path)) return '';
            if (strpos($path, 'http') === 0) return $path; // Already absolute
            
            if (strpos($path, '/uploads/') === 0) {
                if (!empty($_ENV['APP_URL'])) {
                    return rtrim($_ENV['APP_URL'], '/') . $path;
                }
                 // Fallback with Proxy Support
                $uri = $request->getUri();
                $scheme = $request->getHeaderLine('X-Forwarded-Proto') ?: $uri->getScheme();
                $authority = $request->getHeaderLine('X-Forwarded-Host') ?: $uri->getAuthority();
                $basePath = $uri->getBasePath();
                $base = ($basePath === '/' || $basePath === '') ? '' : $basePath;
                
                if (empty($authority)) $authority = 'localhost';

                return $scheme . '://' . $authority . $base . $path;
            }
            return $path;
        };

        $logoUrl = $resolveUrl($logoPath);
        $pngLogoPath = Setting::get('app_logo_png_path', '');
        $pngLogoUrl = $resolveUrl($pngLogoPath);

        if (!$logoUrl) $logoUrl = '/logo.jpg';

        // Trending Platforms
        $trendingPlatformsStr = Setting::get('top_trending_platforms', 'web,android,ios,tv');
        $trendingPlatforms = array_map('trim', explode(',', $trendingPlatformsStr));

        return ResponseFormatter::success($response, [
            'logo_url' => $logoUrl,
            'app_logo_png_url' => $pngLogoUrl,
            'maintenance_mode' => $maintenanceMode === '1',
            'maintenance_title' => $maintenanceTitle,
            'maintenance_message' => $maintenanceMessage,
            'top_trending_platforms' => $trendingPlatforms,
        ]);
    }
}
