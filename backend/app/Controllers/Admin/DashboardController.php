<?php

namespace App\Controllers\Admin;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\Channel;
use App\Models\Customer;
use App\Helpers\ResponseFormatter;

class DashboardController
{
    public function getStats(Request $request, Response $response): Response
    {
        $stats = [
            'total_channels' => Channel::count(),
            'active_channels' => Channel::where('status', 'active')->count(),
            'total_customers' => Customer::count(),
            'active_customers' => Customer::where('status', 'active')->count(),
        ];

        return ResponseFormatter::success($response, $stats);
    }

    public function getTrendingStats(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();
        $limit = $params['limit'] ?? 10;
        
        // Check if viewers_count column exists or we need to count relations.
        // Assuming viewers_count exists based on frontend usage, or we aggregate relation.
        // Frontend ClassicHome uses channel.viewers_count. 
        // If it's a real column, we sort by it.
        // If it's not, we might need to join/count. 
        // Let's assume it's a column or aggregated attribute.
        // Actually, looking at ChannelService might reveal it.
        
        // Viewers count is an aggregate of 'views' relation sum('count')
        $query = Channel::query()
            ->select('channels.name', 'channels.id') // id needed for relation matching
            ->where('status', 'active')
            ->withSum('views as viewers_count', 'count')
            ->orderBy('viewers_count', 'desc')
            ->limit((int)$limit);

        if (isset($params['category_id']) && $params['category_id'] !== 'all') {
             // Support legacy ID or generic usage
            $query->where('category_id', $params['category_id']);
        }
        if (isset($params['category_uuid']) && $params['category_uuid'] !== 'all') {
            $query->whereHas('category', function($q) use ($params) {
                $q->where('uuid', $params['category_uuid']);
            });
        }

        if (isset($params['language_id']) && $params['language_id'] !== 'all') {
            $query->where('language_id', $params['language_id']);
        }
        if (isset($params['language_uuid']) && $params['language_uuid'] !== 'all') {
             $query->whereHas('language', function($q) use ($params) {
                $q->where('uuid', $params['language_uuid']);
            });
        }

        $channels = $query->get();

        $data = [
            'labels' => $channels->pluck('name'),
            'data' => $channels->pluck('viewers_count'),
        ];

        return ResponseFormatter::success($response, $data);
    }
}
