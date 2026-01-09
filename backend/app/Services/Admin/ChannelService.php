<?php

namespace App\Services\Admin;

use App\Models\Channel;
use App\Models\State;
use App\Models\District;
use App\Models\Language;
use App\Models\ChannelRating;
use App\Models\ChannelView;
use Ramsey\Uuid\Uuid;
use Exception;

class ChannelService
{
    public function getAll(array $filters = []): array
    {
        $query = Channel::with(['state', 'district', 'language', 'category']);

        if (isset($filters['search']) && !empty($filters['search'])) {
            $query->where('name', 'LIKE', '%' . $filters['search'] . '%');
        } elseif (isset($filters['q']) && !empty($filters['q'])) {
             $query->where('name', 'LIKE', '%' . $filters['q'] . '%');
        }

        if (isset($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        if (isset($filters['state_id'])) {
            $query->where('state_id', $filters['state_id']);
        }

        if (isset($filters['language_id'])) {
            $query->where('language_id', $filters['language_id']);
        }

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $sortBy = $filters['sort_by'] ?? 'id';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        
        $allowedSorts = ['id', 'name', 'created_at', 'status', 'channel_number'];
        if (!in_array($sortBy, $allowedSorts)) $sortBy = 'id';
        if (!in_array(strtolower($sortOrder), ['asc', 'desc'])) $sortOrder = 'desc';

        $perPage = $filters['per_page'] ?? 20;
        return $query->orderBy($sortBy, $sortOrder)->paginate($perPage)->toArray();
    }

    public function create(array $data): Channel
    {
        $channel = new Channel();
        $channel->uuid = Uuid::uuid4()->toString();
        $channel->fill($data);
        $channel->save();

        return $channel->load(['state', 'district', 'language', 'category']);
    }

    public function update(string $uuid, array $data): Channel
    {
        $channel = Channel::where('uuid', $uuid)->firstOrFail();
        $channel->fill($data);
        $channel->save();

        return $channel->load(['state', 'district', 'language', 'category']);
    }

    public function delete(string $uuid): bool
    {
        $channel = Channel::where('uuid', $uuid)->firstOrFail();
        return $channel->delete();
    }

    public function getOne(string $uuid): Channel
    {
        return Channel::where('uuid', $uuid)
            ->with(['state', 'district', 'language', 'category'])
            ->firstOrFail();
    }

    public function search(array $params): array
    {
        $query = Channel::with(['state', 'district', 'language', 'category']);

        if (isset($params['q']) && !empty($params['q'])) {
            $query->where('name', 'LIKE', '%' . $params['q'] . '%');
        }

        if (isset($params['state_id'])) {
            $query->where('state_id', $params['state_id']);
        }

        if (isset($params['language_id'])) {
            $query->where('language_id', $params['language_id']);
        }

        if (isset($params['district_id'])) {
            $query->where('district_id', $params['district_id']);
        }

        $perPage = $params['per_page'] ?? 20;
        return $query->paginate($perPage)->toArray();
    }
    public function getAnalytics(string $uuid): array
    {
        // Query directly to include avg rating and allow inactive channels for admin
        $channel = Channel::where('uuid', $uuid)
            ->with(['state', 'district', 'language'])
            ->withSum('views as calculated_views_count', 'count')
            ->first();

        if (!$channel) {
            throw new Exception('Channel not found');
        }

        // Get Average Rating explicitly
        // We do this BEFORE processing output to ensure we have the Model ID safely
        $avgRating = ChannelRating::where('channel_id', $channel->id)->avg('rating');

        // Get Daily Views for last 30 days
        $thirtyDaysAgo = date('Y-m-d', strtotime('-30 days'));
        
        $dailyViews = ChannelView::where('channel_id', $channel->id)
            ->where('view_date', '>=', $thirtyDaysAgo)
            ->groupBy('view_date')
            ->orderBy('view_date', 'asc')
            ->selectRaw('view_date, SUM(count) as count')
            ->get()
            ->toArray();

        // Process Output (calculates total views, formats strings)
        $channel = $this->processChannelOutput($channel);

        // Fill in missing dates with 0
        $chartData = [];
        $currentDate = $thirtyDaysAgo;
        $today = date('Y-m-d');
        
        $viewsMap = [];
        foreach ($dailyViews as $dv) {
            $viewsMap[$dv['view_date']] = (int)$dv['count'];
        }

        while ($currentDate <= $today) {
            $chartData[] = [
                'date' => $currentDate,
                'count' => $viewsMap[$currentDate] ?? 0
            ];
            $currentDate = date('Y-m-d', strtotime($currentDate . ' +1 day'));
        }

        return [
            'channel' => [
                'name' => $channel->name,
                'logo' => $channel->thumbnail_url,
                'total_views' => $channel->viewers_count_formatted,
                'raw_views' => $channel->viewers_count,
                'avg_rating' => round($avgRating ?? 0, 1),
            ],
            'chart_data' => $chartData
        ];
    }

    private function processChannelOutput($channel)
    {
        // Handle object vs array
        if (is_array($channel)) {
            // Redact Paid URL
            if (!empty($channel['is_premium'])) {
                $channel['hls_url'] = 'PAID_RESTRICTED';
            }
            
            // Calculate Total Views (Column + Logs)
            $manual = (int)($channel['viewers_count'] ?? 0);
            $calculated = (int)($channel['calculated_views_count'] ?? 0);
            $total = $manual + $calculated;
            
            $channel['viewers_count'] = $total;
            $channel['viewers_count_formatted'] = $this->formatViewCount($total);
            
            // Format Daily Views (if exists)
            if (isset($channel['daily_views'])) {
                $channel['daily_views_formatted'] = $this->formatViewCount($channel['daily_views']);
            }

        } elseif (is_object($channel)) {
            // Redact Paid URL
            if (!empty($channel->is_premium)) {
                $channel->hls_url = 'PAID_RESTRICTED';
            }

            // Calculate Total Views (Column + Logs)
            $manual = (int)($channel->viewers_count ?? 0);
            $calculated = (int)($channel->calculated_views_count ?? 0);
            $total = $manual + $calculated;

            $channel->viewers_count = $total;
            $channel->viewers_count_formatted = $this->formatViewCount($total);

            // Format Daily Views (if exists)
            if (isset($channel->daily_views)) {
                $channel->daily_views_formatted = $this->formatViewCount($channel->daily_views);
            }
        }
        return $channel;
    }

    private function formatViewCount($count): string
    {
        $count = (int)$count;
        if ($count < 1000) {
            return (string)$count;
        }

        if ($count < 1000000) {
            return round($count / 1000, 1) . 'K';
        }

        return round($count / 1000000, 1) . 'M';
    }
}
