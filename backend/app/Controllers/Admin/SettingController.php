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
}
