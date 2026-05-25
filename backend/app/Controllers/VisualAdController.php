<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\VisualAd;
use App\Models\Subscription;
use App\Helpers\ResponseFormatter;

class VisualAdController
{
    /**
     * Return one active visual ad for the current viewer.
     * Returns null data (200) when no ad should be shown for this user/plan.
     */
    public function active(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');

        // If the user has an active paid plan with show_visual_ads = 0, serve nothing
        if ($user) {
            $sub = Subscription::where('customer_id', $user->id)
                ->where('status', 'active')
                ->where('end_date', '>=', now())
                ->with('plan')
                ->first();

            if ($sub && $sub->plan && !$sub->plan->show_visual_ads) {
                return ResponseFormatter::success($response, null, 'Ad-free plan');
            }
        }

        $today = date('Y-m-d');

        $query = VisualAd::where('status', 'active')
            ->where(function ($q) use ($today) {
                $q->whereNull('start_date')->orWhere('start_date', '<=', $today);
            })
            ->where(function ($q) use ($today) {
                $q->whereNull('end_date')->orWhere('end_date', '>=', $today);
            });

        // Guest filter
        if (!$user) {
            $query->where('show_for_guests', 1);
        }

        // Free-user filter (user is logged in but has no active paid plan)
        if ($user) {
            $hasPaidPlan = isset($sub) && $sub !== null;
            if (!$hasPaidPlan) {
                $query->where('show_for_free_users', 1);
            }
        }

        $ads = $query->get();

        if ($ads->isEmpty()) {
            return ResponseFormatter::success($response, null, 'No active ads');
        }

        // Weighted random selection
        $totalWeight = $ads->sum('weight');
        $rand        = rand(1, max($totalWeight, 1));
        $current     = 0;
        $selected    = $ads->last(); // fallback

        foreach ($ads as $ad) {
            $current += $ad->weight;
            if ($rand <= $current) {
                $selected = $ad;
                break;
            }
        }

        return ResponseFormatter::success($response, $selected);
    }

    /** Track a served impression */
    public function impression(Request $request, Response $response, string $uuid): Response
    {
        $ad = VisualAd::where('uuid', $uuid)->first();
        if (!$ad) return ResponseFormatter::error($response, 'Ad not found', 404);
        $ad->increment('total_impressions');
        return ResponseFormatter::success($response, null, 'Impression tracked');
    }

    /** Track a skip */
    public function skip(Request $request, Response $response, string $uuid): Response
    {
        $ad = VisualAd::where('uuid', $uuid)->first();
        if (!$ad) return ResponseFormatter::error($response, 'Ad not found', 404);
        $ad->increment('total_skips');
        return ResponseFormatter::success($response, null, 'Skip tracked');
    }

    /** Track a click-through */
    public function click(Request $request, Response $response, string $uuid): Response
    {
        $ad = VisualAd::where('uuid', $uuid)->first();
        if (!$ad) return ResponseFormatter::error($response, 'Ad not found', 404);
        $ad->increment('total_clicks');
        return ResponseFormatter::success($response, null, 'Click tracked');
    }
}
