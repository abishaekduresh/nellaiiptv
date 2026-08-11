<?php

namespace App\Controllers\Admin;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\Ad;
use App\Helpers\ResponseFormatter;
use Ramsey\Uuid\Uuid;

class AdAdminController
{
    private const TYPES = ['banner', 'inline', 'video'];
    private const STATUSES = ['active', 'inactive'];

    public function index(Request $request, Response $response): Response
    {
        $ads = Ad::orderBy('created_at', 'desc')->get();
        return ResponseFormatter::success($response, $ads, 'Ads retrieved successfully');
    }

    public function create(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody() ?? [];

        if (empty($data['title']) || empty($data['media_url'])) {
            return ResponseFormatter::error($response, 'Title and Media URL are required', 400);
        }

        $type = $data['type'] ?? 'banner';
        if (!in_array($type, self::TYPES, true)) {
            return ResponseFormatter::error($response, 'Invalid type. Use: ' . implode(', ', self::TYPES), 400);
        }

        $status = $data['status'] ?? 'active';
        if (!in_array($status, self::STATUSES, true)) {
            return ResponseFormatter::error($response, 'Invalid status', 400);
        }

        $ad = new Ad();
        $ad->uuid = Uuid::uuid4()->toString();
        $ad->title = $data['title'];
        $ad->type = $type;
        $ad->media_url = $data['media_url'];
        $ad->redirect_url = $data['redirect_url'] ?? null;
        $ad->run_time_sec = (int)($data['run_time_sec'] ?? 10);
        $ad->idle_time_sec = (int)($data['idle_time_sec'] ?? 0);
        $ad->status = $status;
        $ad->save();

        return ResponseFormatter::success($response, $ad, 'Ad created successfully', 201);
    }

    public function show(Request $request, Response $response, string $uuid): Response
    {
        $ad = Ad::where('uuid', $uuid)->first();
        if (!$ad) {
            return ResponseFormatter::error($response, 'Ad not found', 404);
        }

        return ResponseFormatter::success($response, $ad, 'Ad retrieved successfully');
    }

    public function update(Request $request, Response $response, string $uuid): Response
    {
        $ad = Ad::where('uuid', $uuid)->first();
        if (!$ad) {
            return ResponseFormatter::error($response, 'Ad not found', 404);
        }

        $data = $request->getParsedBody() ?? [];

        if (isset($data['title'])) $ad->title = $data['title'];
        if (isset($data['media_url'])) $ad->media_url = $data['media_url'];
        if (array_key_exists('redirect_url', $data)) $ad->redirect_url = $data['redirect_url'] ?: null;
        if (isset($data['run_time_sec'])) $ad->run_time_sec = (int)$data['run_time_sec'];
        if (isset($data['idle_time_sec'])) $ad->idle_time_sec = (int)$data['idle_time_sec'];

        if (isset($data['type'])) {
            if (!in_array($data['type'], self::TYPES, true)) {
                return ResponseFormatter::error($response, 'Invalid type', 400);
            }
            $ad->type = $data['type'];
        }

        if (isset($data['status'])) {
            if (!in_array($data['status'], self::STATUSES, true)) {
                return ResponseFormatter::error($response, 'Invalid status', 400);
            }
            $ad->status = $data['status'];
        }

        $ad->save();

        return ResponseFormatter::success($response, $ad, 'Ad updated successfully');
    }

    public function delete(Request $request, Response $response, string $uuid): Response
    {
        $ad = Ad::where('uuid', $uuid)->first();
        if (!$ad) {
            return ResponseFormatter::error($response, 'Ad not found', 404);
        }

        $ad->delete();
        return ResponseFormatter::success($response, null, 'Ad deleted successfully');
    }
}
