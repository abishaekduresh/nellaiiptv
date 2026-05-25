<?php

namespace App\Controllers\Admin;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\VisualAd;
use App\Helpers\ResponseFormatter;
use Ramsey\Uuid\Uuid;

class VisualAdAdminController
{
    public function index(Request $request, Response $response): Response
    {
        $ads = VisualAd::orderBy('created_at', 'desc')->get();
        return ResponseFormatter::success($response, $ads, 'Visual ads retrieved');
    }

    public function create(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody() ?? [];

        if (empty($data['title'])) {
            return ResponseFormatter::error($response, 'Title is required', 422);
        }
        if (empty($data['ad_url'])) {
            return ResponseFormatter::error($response, 'Ad URL is required', 422);
        }

        $ad = new VisualAd();
        $ad->uuid                       = Uuid::uuid4()->toString();
        $ad->title                      = $data['title'];
        $ad->description                = $data['description'] ?? null;
        $ad->ad_url                     = $data['ad_url'];
        $ad->click_url                  = $data['click_url'] ?? null;
        $ad->thumbnail_url              = $data['thumbnail_url'] ?? null;
        $ad->is_skippable               = filter_var($data['is_skippable'] ?? true, FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
        $ad->skip_after_seconds         = (int)($data['skip_after_seconds'] ?? 5);
        $ad->duration_seconds           = (int)($data['duration_seconds'] ?? 30);
        $ad->show_for_guests            = filter_var($data['show_for_guests'] ?? true, FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
        $ad->show_for_free_users        = filter_var($data['show_for_free_users'] ?? true, FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
        $ad->max_impressions_per_session= (int)($data['max_impressions_per_session'] ?? 3);
        $ad->display_frequency          = (int)($data['display_frequency'] ?? 1);
        $ad->weight                     = (int)($data['weight'] ?? 1);
        $ad->start_date                 = !empty($data['start_date']) ? $data['start_date'] : null;
        $ad->end_date                   = !empty($data['end_date'])   ? $data['end_date']   : null;
        $ad->status                     = $data['status'] ?? 'active';
        $ad->save();

        return ResponseFormatter::success($response, $ad, 'Visual ad created', 201);
    }

    public function show(Request $request, Response $response, string $uuid): Response
    {
        $ad = VisualAd::where('uuid', $uuid)->first();
        if (!$ad) return ResponseFormatter::error($response, 'Visual ad not found', 404);
        return ResponseFormatter::success($response, $ad);
    }

    public function update(Request $request, Response $response, string $uuid): Response
    {
        $ad = VisualAd::where('uuid', $uuid)->first();
        if (!$ad) return ResponseFormatter::error($response, 'Visual ad not found', 404);

        $data = $request->getParsedBody() ?? [];

        if (isset($data['title']))                      $ad->title                      = $data['title'];
        if (isset($data['description']))                $ad->description                = $data['description'];
        if (isset($data['ad_url']))                     $ad->ad_url                     = $data['ad_url'];
        if (isset($data['click_url']))                  $ad->click_url                  = $data['click_url'];
        if (isset($data['thumbnail_url']))              $ad->thumbnail_url              = $data['thumbnail_url'];
        if (isset($data['is_skippable']))               $ad->is_skippable               = filter_var($data['is_skippable'], FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
        if (isset($data['skip_after_seconds']))         $ad->skip_after_seconds         = (int)$data['skip_after_seconds'];
        if (isset($data['duration_seconds']))           $ad->duration_seconds           = (int)$data['duration_seconds'];
        if (isset($data['show_for_guests']))            $ad->show_for_guests            = filter_var($data['show_for_guests'], FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
        if (isset($data['show_for_free_users']))        $ad->show_for_free_users        = filter_var($data['show_for_free_users'], FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
        if (isset($data['max_impressions_per_session'])) $ad->max_impressions_per_session = (int)$data['max_impressions_per_session'];
        if (isset($data['display_frequency']))          $ad->display_frequency          = (int)$data['display_frequency'];
        if (isset($data['weight']))                     $ad->weight                     = (int)$data['weight'];
        if (array_key_exists('start_date', $data))     $ad->start_date                 = !empty($data['start_date']) ? $data['start_date'] : null;
        if (array_key_exists('end_date', $data))       $ad->end_date                   = !empty($data['end_date'])   ? $data['end_date']   : null;
        if (isset($data['status']))                     $ad->status                     = $data['status'];

        $ad->save();
        return ResponseFormatter::success($response, $ad, 'Visual ad updated');
    }

    public function delete(Request $request, Response $response, string $uuid): Response
    {
        $ad = VisualAd::where('uuid', $uuid)->first();
        if (!$ad) return ResponseFormatter::error($response, 'Visual ad not found', 404);
        $ad->delete();
        return ResponseFormatter::success($response, null, 'Visual ad deleted');
    }
}
