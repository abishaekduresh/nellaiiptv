<?php

namespace App\Controllers\Admin;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\ScrollingAd;
use App\Helpers\ResponseFormatter;
use Ramsey\Uuid\Uuid;

class ScrollingAdAdminController
{
    public function index(Request $request, Response $response): Response
    {
        $ads = ScrollingAd::orderBy('created_at', 'desc')->get();
        // Return wrapped in 'data' so the frontend gets res.data.data.data if nested,
        // Wait, typical Slim ResponseFormatter::success($res, $data) gives JSON:
        // { "status": true, "message": "...", "data": [...] }
        // Next.js res.data is the JSON object. res.data.data is the array!
        // So the AdminController IS correct. 
        return ResponseFormatter::success($response, $ads, 'Scrolling ads retrieved successfully');
    }

    public function create(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        
        $ad = new ScrollingAd();
        $ad->uuid = Uuid::uuid4()->toString();
        $ad->text_content = $data['text_content'] ?? '';
        $ad->repeat_count = $data['repeat_count'] ?? 3;
        $ad->scroll_speed = $data['scroll_speed'] ?? 50;
        $ad->status = $data['status'] ?? 'active';
        $ad->save();

        return ResponseFormatter::success($response, $ad, 'Scrolling ad created successfully', 201);
    }

    public function show(Request $request, Response $response, string $uuid): Response
    {
        $ad = ScrollingAd::where('uuid', $uuid)->first();
        if (!$ad) {
            return ResponseFormatter::error($response, 'Scrolling ad not found', 404);
        }

        return ResponseFormatter::success($response, $ad, 'Scrolling ad retrieved successfully');
    }

    public function update(Request $request, Response $response, string $uuid): Response
    {
        $ad = ScrollingAd::where('uuid', $uuid)->first();
        if (!$ad) {
            return ResponseFormatter::error($response, 'Scrolling ad not found', 404);
        }

        $data = $request->getParsedBody();
        if (isset($data['text_content'])) $ad->text_content = $data['text_content'];
        if (isset($data['repeat_count'])) $ad->repeat_count = $data['repeat_count'];
        if (isset($data['scroll_speed'])) $ad->scroll_speed = $data['scroll_speed'];
        if (isset($data['status'])) $ad->status = $data['status'];
        $ad->save();

        return ResponseFormatter::success($response, $ad, 'Scrolling ad updated successfully');
    }

    public function delete(Request $request, Response $response, string $uuid): Response
    {
        $ad = ScrollingAd::where('uuid', $uuid)->first();
        if (!$ad) {
            return ResponseFormatter::error($response, 'Scrolling ad not found', 404);
        }

        $ad->delete();
        return ResponseFormatter::success($response, null, 'Scrolling ad deleted successfully');
    }
}
