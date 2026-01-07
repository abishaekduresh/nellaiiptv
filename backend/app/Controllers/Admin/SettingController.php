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
        $settings = Setting::all()->toArray();
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

        // Generate filename (e.g., logo.png or logo_TIMESTAMP.png to bust cache)
        // Using a fixed name 'logo' + extension to keep it simple, or timestamp for versioning.
        // Let's use timestamp to ensure clients refresh it.
        $filename = 'logo_' . time() . '.' . $extension;
        $activeFilename = 'logo'. '.' . $extension; // We might want a stable name for easy access, but cache is issue.
        
        // Let's stick to a stable name but we'll return a versioned URL query string if needed, 
        // OR just overwrite 'logo.png' if we enforce PNG? 
        // Better: Save as branding/logo.png (or whatever extension) and user just references that. 
        // To support different extensions, we should save the full path in DB.

        $filename = 'logo_' . time() . '.' . $extension;
        $path = $directory . DIRECTORY_SEPARATOR . $filename;

        try {
            $uploadedFile->moveTo($path);
            
            // Clean up old logos? (Optional, but good practice)
            // For now, let's just save the new path.

            // URL to access the file
            // Assuming /uploads is mapped to public/uploads
            $logoUrl = '/uploads/branding/' . $filename;

            // Update Setting
            Setting::set('logo_url', $logoUrl);

            return ResponseFormatter::success($response, ['url' => $logoUrl], 'Logo uploaded successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, 'Failed to upload logo: ' . $e->getMessage(), 500);
        }
    }
}
