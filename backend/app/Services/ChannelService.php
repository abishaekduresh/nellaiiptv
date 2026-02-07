<?php

namespace App\Services;

use App\Models\Channel;
use App\Models\ChannelRating;
use App\Models\ChannelView;
use App\Models\ChannelComment;
use App\Models\ChannelReport;
use App\Models\LiveViewer;
use App\Models\Setting;
use Ramsey\Uuid\Uuid;
use Exception;
use Illuminate\Database\Capsule\Manager as DB;

class ChannelService
{
    /**
     * Check if channels should be blocked globally
     * @param string $platform The platform making the request (web, android, ios, tv)
     * @return bool True if channels should be blocked
     */
    private function isChannelsBlocked(string $platform): bool
    {
        // Check if all channels are blocked globally
        $blockAll = Setting::where('setting_key', 'block_all_channels')->value('setting_value');
        if ($blockAll === '1') {
            return true;
        }

        // Check if specific platform is disabled
        $disabledPlatforms = Setting::where('setting_key', 'disabled_platforms')->value('setting_value');
        if ($disabledPlatforms) {
            $disabled = explode(',', $disabledPlatforms);
            $disabled = array_map('trim', $disabled);
            if (in_array($platform, $disabled)) {
                return true;
            }
        }

        return false;
    }

    private function formatViewCount($count): string
    {
        $count = (int)$count;
        if ($count < 1000) {
            return (string)$count;
        }

        if ($count < 1000000) {
            $value = floor($count / 100); // 2253 -> 22
            $normalized = $value / 10;    // 2.2
            $suffix = ($count > ($value * 100)) ? 'K' : 'K';
            return $normalized . $suffix;
        }

        $value = floor($count / 100000); // 2253000 -> 22
        $normalized = $value / 10;       // 2.2
        $suffix = ($count > ($value * 100000)) ? 'M' : 'M';
        return $normalized . $suffix;
    }

    private function processChannelOutput($channel, bool $allowPremium = false)
    {
        // Helper to extract user rating if relation loaded
        $userRatingVal = 0;
        
        // Handle Eloquent Collection vs Array mismatch if relation loaded
        // When using toArray(), relations become nested arrays
        $ratings = null;
        
        if (is_object($channel)) {
            if ($channel->relationLoaded('ratings')) {
                $ratings = $channel->ratings;
                unset($channel->ratings); // Clean up
            }
        } elseif (is_array($channel)) {
            if (isset($channel['ratings'])) {
                $ratings = $channel['ratings'];
                unset($channel['ratings']);
            }
        }

        if (!empty($ratings)) {
            // If it's a collection or array with item
             $first = is_object($ratings) ? $ratings->first() : ($ratings[0] ?? null);
             if ($first) {
                 $userRatingVal = is_object($first) ? $first->rating : $first['rating'];
             }
        }

        // Handle object vs array
        if (is_array($channel)) {
            // Set User Rating
            $channel['user_rating'] = $userRatingVal;
            
            // Redact Paid URL if not allowed
            if (!empty($channel['is_premium']) && !$allowPremium) {
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
            // Set User Rating
            $channel->user_rating = $userRatingVal;

            // Redact Paid URL if not allowed
            if (!empty($channel->is_premium) && !$allowPremium) {
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

    public function getAll(array $filters = [], bool $allowPremium = false): array
    {
        // Check if channels are globally blocked for this platform
        $platform = $filters['platform'] ?? 'web';
        if ($this->isChannelsBlocked($platform)) {
            // Return empty result set
            return isset($filters['limit']) && (int)$filters['limit'] === -1 
                ? [] 
                : [
                    'current_page' => 1,
                    'data' => [],
                    'first_page_url' => null,
                    'from' => null,
                    'last_page' => 1,
                    'last_page_url' => null,
                    'next_page_url' => null,
                    'path' => null,
                    'per_page' => isset($filters['limit']) ? (int)$filters['limit'] : 20,
                    'prev_page_url' => null,
                    'to' => null,
                    'total' => 0
                ];
        }

        $query = Channel::query()
            ->select('channels.*')
            ->where('status', 'active')
            ->with(['language', 'state', 'district', 'category'])
            // Don't alias as viewers_count to avoid overwriting the manual column
            ->withSum('views as calculated_views_count', 'count')
            ->withAvg('ratings as average_rating', 'rating')
            ->withCount('ratings');

        // Eager Load User Rating if Customer ID provided
        if (isset($filters['customer_id'])) {
            $customerId = $filters['customer_id'];
            $query->with(['ratings' => function($q) use ($customerId) {
                $q->where('customer_id', $customerId);
            }]);
        }
        
        if (isset($filters['language_id'])) {
            $query->where('language_id', $filters['language_id']);
        }
        if (isset($filters['language_uuid'])) {
            $query->whereHas('language', function ($q) use ($filters) {
                $q->where('uuid', $filters['language_uuid']);
            });
        }
        if (isset($filters['state_id'])) {
            $query->where('state_id', $filters['state_id']);
        }
        if (isset($filters['state_uuid'])) {
            $query->whereHas('state', function ($q) use ($filters) {
                $q->where('uuid', $filters['state_uuid']);
            });
        }
        if (isset($filters['district_id'])) {
            $query->where('district_id', $filters['district_id']);
        }
        if (isset($filters['district_uuid'])) {
            $query->whereHas('district', function ($q) use ($filters) {
                $q->where('uuid', $filters['district_uuid']);
            });
        }
        if (isset($filters['search'])) {
            $searchTerm = $filters['search'];
            $query->where(function($q) use ($searchTerm) {
                $q->where('name', 'like', '%' . $searchTerm . '%')
                  ->orWhere('channel_number', 'like', '%' . $searchTerm . '%');
            });
        }

        // Platform Filtering
        if (isset($filters['platform'])) {
            $platform = $filters['platform'];
            // Since allowed_platforms is a SET, we can use FIND_IN_SET
            $query->whereRaw("FIND_IN_SET(?, allowed_platforms)", [$platform]);
        }

        // Sorting logic
        if (isset($filters['sort'])) {
            if ($filters['sort'] === 'top_daily') {
                $today = date('Y-m-d');
                $query->join('channel_views', function($join) use ($today) {
                    $join->on('channels.id', '=', 'channel_views.channel_id')
                         ->where('channel_views.view_date', '=', $today);
                })
                ->addSelect(DB::raw('SUM(channel_views.count) as daily_views'))
                ->groupBy('channels.id')
                ->orderBy('daily_views', 'desc');
            } elseif ($filters['sort'] === 'top_trending') {
                // Top trending: Most views in last 3 days
                $statsDate = date('Y-m-d', strtotime('-3 days'));
                $query->join('channel_views', function($join) use ($statsDate) {
                    $join->on('channels.id', '=', 'channel_views.channel_id')
                         ->where('channel_views.view_date', '>=', $statsDate);
                })
                ->addSelect(DB::raw('SUM(channel_views.count) as daily_views'))
                ->groupBy('channels.id')
                ->orderBy('daily_views', 'desc');
            } elseif ($filters['sort'] === 'top_all_time') {
                $query->orderBy('viewers_count', 'desc');
            } elseif ($filters['sort'] === 'newest') {
                $query->orderBy('created_at', 'desc');
            }
        } else {
            $query->orderBy('channel_number', 'asc');
        }

        $results = [];
        if (isset($filters['limit']) && (int)$filters['limit'] === -1) {
            $results = $query->get()->toArray();
        } else {
            $limit = isset($filters['limit']) ? (int)$filters['limit'] : 20;
            $results = $query->paginate($limit)->toArray();
        }

        // Handle pagination structure or direct array
        if (isset($results['data'])) {
            foreach ($results['data'] as &$item) {
                $item = $this->processChannelOutput($item, $allowPremium);
            }
        } else {
            foreach ($results as &$item) {
                $item = $this->processChannelOutput($item, $allowPremium);
            }
        }

        return $results;
    }

    public function getFeatured(int $limit = 20, string $platform = 'web', bool $allowPremium = false): array
    {
        // Check if channels are globally blocked for this platform
        if ($this->isChannelsBlocked($platform)) {
            return [];
        }

        $channels = Channel::where('status', 'active')
            ->where('is_featured', 1)
            ->whereRaw("FIND_IN_SET(?, allowed_platforms)", [$platform])
            ->with(['state', 'district', 'language'])
            ->withSum('views as calculated_views_count', 'count')
            ->withAvg('ratings as average_rating', 'rating')
            ->withCount('ratings')
            ->limit($limit)
            ->get()
            ->toArray();

        foreach ($channels as &$channel) {
            $channel = $this->processChannelOutput($channel, $allowPremium);
        }

        return $channels;
    }

    public function getOne(string $uuid, string $platform = 'web', bool $allowPremium = false): Channel
    {
        $channel = Channel::where('uuid', $uuid)
            ->where('status', 'active')
            ->with(['state', 'district', 'language'])
            ->withSum('views as calculated_views_count', 'count')
            ->first();

        if (!$channel) {
            // Debugging: Check if it exists at all
            $anyChannel = Channel::where('uuid', $uuid)->first();
            if ($anyChannel) {
                throw new Exception("Channel found but status is '" . $anyChannel->status . "' (Expected: active)");
            }
            throw new Exception("Channel with UUID '$uuid' does not exist in the database.");
        }

        // Check Platform Restriction
        // We use FIND_IN_SET logic similar to SQL filtering, but in PHP for the single object
        $allowed = explode(',', $channel->allowed_platforms);
        if (!in_array($platform, $allowed)) {
            // Soft Restriction: Don't throw 403, but break the URL with a message
            $channel->hls_url = "RESTRICTED: This channel is not available on " . ucfirst($platform);
        }

        // Append average rating safely
        try {
            $avg = $channel->ratings()->avg('rating');
            $channel->average_rating = $avg ? round($avg, 1) : 0;
        } catch (Exception $e) {
            $channel->average_rating = 0;
            // Log error but don't fail the request
            error_log("Error fetching ratings for channel $uuid: " . $e->getMessage());
        }

        return $this->processChannelOutput($channel, $allowPremium);
    }

    public function rate(string $uuid, int $rating, int $customerId): void
    {
        $channel = $this->getOne($uuid);
        
        ChannelRating::updateOrCreate(
            ['channel_id' => $channel->id, 'customer_id' => $customerId],
            ['rating' => $rating]
        );
    }

    public function getRatings(string $uuid): array
    {
        $channel = $this->getOne($uuid);
        
        $avg = $channel->ratings()->avg('rating');
        $count = $channel->ratings()->count();
        
        return [
            'average_rating' => round($avg, 1),
            'total_ratings' => $count
        ];
    }

    public function addComment(string $uuid, string $comment, int $customerId): ChannelComment
    {
        $channel = $this->getOne($uuid);

        $newComment = new ChannelComment();
        $newComment->uuid = Uuid::uuid4()->toString(); // Changed to uuid4 for compatibility
        $newComment->channel_id = $channel->id;
        $newComment->customer_id = $customerId;
        $newComment->comment = $comment;
        $newComment->status = 'active';
        $newComment->save();

        return $newComment;
    }

    public function getComments(string $uuid): array
    {
        $channel = $this->getOne($uuid);
        
        return $channel->comments()
            ->where('status', 'active')
            ->with('customer:id,name')
            ->orderBy('created_at', 'desc')
            ->paginate(20)
            ->toArray();
    }

    public function getRelated(string $uuid, string $platform = 'web', bool $allowPremium = false): array
    {
        // Check if channels are globally blocked for this platform
        if ($this->isChannelsBlocked($platform)) {
            return [];
        }

        $channel = $this->getOne($uuid);
        
        $channels = Channel::where('language_id', $channel->language_id)
            ->where('uuid', '!=', $uuid)
            ->where('status', 'active')
            ->whereRaw("FIND_IN_SET(?, allowed_platforms)", [$platform])
            ->withSum('views as calculated_views_count', 'count')
            ->withAvg('ratings as average_rating', 'rating')
            ->withCount('ratings')
            ->limit(10)
            ->get()
            ->toArray();

        foreach ($channels as &$item) {
            $item = $this->processChannelOutput($item, $allowPremium);
        }

        return $channels;
    }

    public function getNew(string $platform = 'web', bool $allowPremium = false): array
    {
        // Check if channels are globally blocked for this platform
        if ($this->isChannelsBlocked($platform)) {
            return [];
        }

        $channels = Channel::where('status', 'active')
            ->whereRaw("FIND_IN_SET(?, allowed_platforms)", [$platform])
            ->orderBy('created_at', 'desc')
            ->withSum('views as calculated_views_count', 'count')
            ->withAvg('ratings as average_rating', 'rating')
            ->withCount('ratings')
            ->limit(10)
            ->get()
            ->toArray();

        foreach ($channels as &$item) {
            $item = $this->processChannelOutput($item, $allowPremium);
        }

        return $channels;
    }

    public function incrementView(string $uuid, string $ip = '0.0.0.0'): void
    {
        $channel = Channel::where('uuid', $uuid)->first();
        if ($channel) {
            // Only update daily views now, total is calculated
            try {
                $today = date('Y-m-d');
                $view = ChannelView::firstOrCreate(
                    [
                        'channel_id' => $channel->id, 
                        'view_date' => $today,
                        'client_ip' => $ip
                    ],
                    ['count' => 0]
                );
                $view->increment('count');
            } catch (Exception $e) {
                error_log("Error incrementing daily view: " . $e->getMessage());
            }
        }
    }

    public function heartbeat(string $uuid, string $deviceUuid): int
    {
        $channel = $this->getOne($uuid);

        LiveViewer::updateOrCreate(
            ['channel_id' => $channel->id, 'device_uuid' => $deviceUuid],
            ['last_heartbeat' => date('Y-m-d H:i:s')]
        );

        // Clean up old viewers (inactive for > 2 minutes)
        LiveViewer::where('last_heartbeat', '<', date('Y-m-d H:i:s', strtotime('-2 minutes')))->delete();

        return LiveViewer::where('channel_id', $channel->id)->count();
    }

    public function createReport(string $uuid, string $issueType, ?string $description, ?int $customerId): ChannelReport
    {
        $channel = $this->getOne($uuid);

        $report = new ChannelReport();
        $report->uuid = Uuid::uuid4()->toString();
        $report->channel_id = $channel->id;
        $report->customer_id = $customerId;
        $report->issue_type = $issueType;
        $report->description = $description;
        $report->status = 'pending';
        $report->save();

        return $report;
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

        // Process Output (calculates total views, formats strings)
        $channel = $this->processChannelOutput($channel);

        // Get Average Rating explicitly to avoid "Call to avg() on null" error
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
}
