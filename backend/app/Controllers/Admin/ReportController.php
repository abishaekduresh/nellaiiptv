<?php

namespace App\Controllers\Admin;

use App\Helpers\ResponseFormatter;
use Illuminate\Database\Capsule\Manager as DB;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class ReportController
{
    public function getChannelViews(Request $request, Response $response)
    {
        $params = $request->getQueryParams();
        $startDate = $params['start_date'] ?? date('Y-m-d', strtotime('-30 days'));
        $endDate = $params['end_date'] ?? date('Y-m-d');
        $channelId = $params['channel_id'] ?? null;
        $status = $params['status'] ?? 'active';

        // Base Query
        $dailyViewsQuery = DB::table('channel_views')
            ->select(DB::connection()->raw('DATE(view_date) as date'), DB::connection()->raw('SUM(count) as total_views'))
            ->whereBetween('view_date', [$startDate, $endDate]);
            
        $channelStatsQuery = DB::table('channel_views')
            ->join('channels', 'channel_views.channel_id', '=', 'channels.id')
            ->select(
                'channel_views.channel_id',
                'channels.name as channel_name',
                'channels.channel_number',
                DB::connection()->raw('SUM(channel_views.count) as total_views')
            )
            ->whereBetween('view_date', [$startDate, $endDate]);

        // Apply status filter
        if ($status !== 'all') {
            $channelStatsQuery->where('channels.status', $status);
            
            // For daily views, we need to filter by channels with the specific status
            $channelIds = DB::table('channels')
                ->where('status', $status)
                ->pluck('id');
            $dailyViewsQuery->whereIn('channel_id', $channelIds);
        }

        if ($channelId) {
            $dailyViewsQuery->where('channel_id', $channelId);
            $channelStatsQuery->where('channel_views.channel_id', $channelId);
        }

        // 1. Chart Data: Views per day
        $dailyViews = $dailyViewsQuery
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // 2. Table Data: Views per channel with details (for the table and CSV)
        $channelStats = $channelStatsQuery
            ->groupBy('channel_views.channel_id', 'channels.name', 'channels.channel_number')
            ->orderByDesc('total_views')
            ->get();
            
        // 3. Total Stats
        $totalViews = $dailyViews->sum('total_views');
        $topChannel = $channelStats->first();

        // Prepare Response
        $data = [
            'chart_data' => [
                'labels' => $dailyViews->pluck('date'),
                'datasets' => [
                    [
                        'label' => $channelId ? 'Views for selected channel' : 'Total Views',
                        'data' => $dailyViews->pluck('total_views'),
                        'borderColor' => 'rgb(75, 192, 192)',
                        'tension' => 0.1
                    ]
                ]
            ],
            'table_data' => $channelStats,
            'summary' => [
                'total_views' => $totalViews,
                'top_channel' => $topChannel ? $topChannel->channel_name : 'N/A',
                'start_date' => $startDate,
                'end_date' => $endDate
            ]
        ];

        return ResponseFormatter::success($response, $data, 'Channel views report retrieved successfully');
    }

    public function getChannelViewDetails(Request $request, Response $response)
    {
        $params     = $request->getQueryParams();
        $channelId  = $params['channel_id']  ?? null;
        $startDate  = $params['start_date']  ?? date('Y-m-d', strtotime('-30 days'));
        $endDate    = $params['end_date']    ?? date('Y-m-d');

        if (!$channelId) {
            return ResponseFormatter::error($response, null, 'channel_id is required', 400);
        }

        $details = DB::table('channel_views')
            ->join('channels', 'channel_views.channel_id', '=', 'channels.id')
            ->select(
                'channel_views.client_ip',
                'channel_views.view_date',
                'channel_views.count',
                'channels.name as channel_name',
                'channels.channel_number'
            )
            ->where('channel_views.channel_id', $channelId)
            ->whereBetween('channel_views.view_date', [$startDate, $endDate])
            ->orderBy('channel_views.view_date', 'desc')
            ->orderBy('channel_views.count', 'desc')
            ->get();

        $channelInfo = DB::table('channels')->find($channelId);

        $data = [
            'details' => $details,
            'summary' => [
                'total_views' => $details->sum('count'),
                'unique_ips'  => $details->pluck('client_ip')->unique()->filter()->count(),
                'channel_name'   => $channelInfo->name   ?? ($details->first()->channel_name   ?? 'Unknown'),
                'channel_number' => $channelInfo->channel_number ?? ($details->first()->channel_number ?? 'N/A'),
                'start_date' => $startDate,
                'end_date'   => $endDate,
            ],
        ];

        return ResponseFormatter::success($response, $data, 'Channel view details retrieved successfully');
    }
}
