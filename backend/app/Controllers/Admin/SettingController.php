<?php

namespace App\Controllers\Admin;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\Setting;
use App\Helpers\ResponseFormatter;
use Exception;

class SettingController
{
    public function index(Request $request, Response $response): Response
    {
        $settings = Setting::all();
        
        // Transform logo_url to absolute URL for admin display
        $settings->transform(function($setting) use ($request) {
            if ($setting->setting_key === 'logo_url' && strpos($setting->setting_value, '/uploads/') === 0) {
                // Check for explicit APP_URL in environment first
                if (!empty($_ENV['APP_URL'])) {
                    $baseUrl = rtrim($_ENV['APP_URL'], '/');
                    $setting->setting_value = $baseUrl . $setting->setting_value;
                } else {
                    // Fallback to auto-detection (best effort for admin)
                    $uri = $request->getUri();
                    $basePath = $uri->getBasePath();
                    $scheme = $uri->getScheme();
                    $authority = $uri->getAuthority();
                    $base = ($basePath === '/' || $basePath === '') ? '' : $basePath;
                    $setting->setting_value = $scheme . '://' . $authority . $base . $setting->setting_value;
                }
            }
            return $setting;
        });

        return ResponseFormatter::success($response, $settings);
    }

    public function update(Request $request, Response $response, string $key): Response
    {
        $data = $request->getParsedBody() ?? [];

        try {
            if (!isset($data['value'])) {
                throw new Exception('Value is required');
            }

            Setting::set($key, $data['value']);
            $setting = Setting::where('setting_key', $key)->first();
            
            return ResponseFormatter::success($response, $setting, 'Setting updated');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 400);
        }
    }

    public function getDisclaimer(Request $request, Response $response): Response
    {
        $disclaimer = Setting::get('disclaimer_text', '');
        return ResponseFormatter::success($response, ['disclaimer' => $disclaimer]);
    }

    public function uploadLogo(Request $request, Response $response): Response
    {
        $uploadedFiles = $request->getUploadedFiles(); // PSR-7
        $uploadedFile = $uploadedFiles['logo'] ?? null;

        if (!$uploadedFile || $uploadedFile->getError() !== UPLOAD_ERR_OK) {
            return ResponseFormatter::error($response, 'No valid file uploaded', 400);
        }

        $extension = pathinfo($uploadedFile->getClientFilename(), PATHINFO_EXTENSION);
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'svg', 'webp'];
        
        if (!in_array(strtolower($extension), $allowedExtensions)) {
            return ResponseFormatter::error($response, 'Invalid file type. Allowed: jpg, png, svg, webp', 400);
        }

        // Define upload directory
        $directory = __DIR__ . '/../../../public/uploads/branding';
        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $filename = 'logo_' . time() . '.' . $extension;
        $path = $directory . DIRECTORY_SEPARATOR . $filename;

        try {
            $uploadedFile->moveTo($path);
            
            // Generate URL
             $relativeUrl = '/uploads/branding/' . $filename;
             $logoUrl = $relativeUrl;

            // Try to make it absolute for storage consistency
            if (!empty($_ENV['APP_URL'])) {
                $baseUrl = rtrim($_ENV['APP_URL'], '/');
                $logoUrl = $baseUrl . $relativeUrl;
            } else {
                 // Fallback: Store absolute URL if possible, or just relative
                 $uri = $request->getUri();
                 $basePath = $uri->getBasePath();
                 $scheme = $uri->getScheme();
                 $authority = $uri->getAuthority();
                 $base = ($basePath === '/' || $basePath === '') ? '' : $basePath;
                 $logoUrl = $scheme . '://' . $authority . $base . $relativeUrl;
            }

            // Update Setting
            Setting::set('logo_url', $logoUrl);

            return ResponseFormatter::success($response, ['url' => $logoUrl], 'Logo uploaded successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, 'Failed to upload logo: ' . $e->getMessage(), 500);
        }
    }
}
