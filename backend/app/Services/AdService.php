<?php

namespace App\Services;

use App\Models\Ad;
use Exception;

class AdService
{
    public function getAds(string $type = null): array
    {
        $query = Ad::where('status', 'active');
        
        if ($type) {
            $query->where('type', $type);
        }

        return $query->get()->toArray();
    }

    public function recordImpression(string $uuid): void
    {
        $ad = Ad::where('uuid', $uuid)->first();
        if (!$ad) {
            throw new Exception('Ad not found');
        }
        
        $ad->increment('impressions');
    }
}
