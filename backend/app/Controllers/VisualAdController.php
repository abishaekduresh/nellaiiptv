<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\VisualAd;
use App\Models\Customer;
use App\Helpers\ResponseFormatter;

class VisualAdController
{
    /**
     * Return one active visual ad for the current viewer.
     * Returns null data (200) when no ad should be shown.
     */
    public function active(Request $request, Response $response): Response
    {
        $jwtUser  = $request->getAttribute('user'); // stdClass from JWT, or null
        $customer = null;

        if ($jwtUser && !empty($jwtUser->sub)) {
            $customer = Customer::where('uuid', $jwtUser->sub)->first();
        }

        // Open-access model: no paid plans exist, so every viewer is treated as a
        // free user. Guests see ads flagged show_for_guests; logged-in users see
        // ads flagged show_for_free_users.
        $today = date('Y-m-d');

        $query = VisualAd::where('status', 'active')
            ->where(function ($q) use ($today) {
                $q->whereNull('start_date')->orWhere('start_date', '<=', $today);
            })
            ->where(function ($q) use ($today) {
                $q->whereNull('end_date')->orWhere('end_date', '>=', $today);
            });

        if (!$customer) {
            $query->where('show_for_guests', 1);
        } else {
            $query->where('show_for_free_users', 1);
        }

        $ads = $query->get();

        if ($ads->isEmpty()) {
            return ResponseFormatter::success($response, null, 'No active ads');
        }

        // Weighted random selection
        $totalWeight = $ads->sum('weight');
        $rand        = rand(1, max((int)$totalWeight, 1));
        $current     = 0;
        $selected    = $ads->last();

        foreach ($ads as $ad) {
            $current += $ad->weight;
            if ($rand <= $current) {
                $selected = $ad;
                break;
            }
        }

        return ResponseFormatter::success($response, $selected);
    }

    public function impression(Request $request, Response $response, string $uuid): Response
    {
        $ad = VisualAd::where('uuid', $uuid)->first();
        if (!$ad) return ResponseFormatter::error($response, 'Ad not found', 404);
        $ad->increment('total_impressions');
        return ResponseFormatter::success($response, null, 'Impression tracked');
    }

    public function skip(Request $request, Response $response, string $uuid): Response
    {
        $ad = VisualAd::where('uuid', $uuid)->first();
        if (!$ad) return ResponseFormatter::error($response, 'Ad not found', 404);
        $ad->increment('total_skips');
        return ResponseFormatter::success($response, null, 'Skip tracked');
    }

    public function click(Request $request, Response $response, string $uuid): Response
    {
        $ad = VisualAd::where('uuid', $uuid)->first();
        if (!$ad) return ResponseFormatter::error($response, 'Ad not found', 404);
        $ad->increment('total_clicks');
        return ResponseFormatter::success($response, null, 'Click tracked');
    }
}
