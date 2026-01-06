<?php

namespace App\Services;

use App\Models\Channel;
use App\Models\ChannelRating;
use App\Models\ChannelView;
use App\Models\ChannelComment;
use App\Models\ChannelReport;
use App\Models\LiveViewer;
use Ramsey\Uuid\Uuid;
use Exception;
use Illuminate\Database\Capsule\Manager as DB;

class ChannelService
{
    public function getAll(array $filters = []): array
    {
        $query = Channel::query()
            ->select('channels.*')
            ->where('status', 'active')
            ->with(['language', 'state', 'district', 'category'])
            ->withAvg('ratings', 'rating')
            ->withSum('views as viewers_count', 'count');

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
        }

        if (isset($filters['limit']) && (int)$filters['limit'] === -1) {
            return $query->get()->toArray();
        }

        $limit = isset($filters['limit']) ? (int)$filters['limit'] : 20;
        return $query->paginate($limit)->toArray();
    }

    public function getFeatured(int $limit = 20): array
    {
        return Channel::where('status', 'active')
            ->where('is_featured', 1)
            ->with(['state', 'district', 'language'])
            ->withSum('views as viewers_count', 'count')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    public function getOne(string $uuid): Channel
    {
        $channel = Channel::where('uuid', $uuid)
            ->where('status', 'active')
            ->with(['state', 'district', 'language'])
            ->withSum('views as viewers_count', 'count')
            ->first();

        if (!$channel) {
            // Debugging: Check if it exists at all
            $anyChannel = Channel::where('uuid', $uuid)->first();
            if ($anyChannel) {
                throw new Exception("Channel found but status is '" . $anyChannel->status . "' (Expected: active)");
            }
            throw new Exception("Channel with UUID '$uuid' does not exist in the database.");
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

        return $channel;
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

    public function getRelated(string $uuid): array
    {
        $channel = $this->getOne($uuid);
        
        return Channel::where('language_id', $channel->language_id)
            ->where('uuid', '!=', $uuid)
            ->where('status', 'active')
            ->withSum('views as viewers_count', 'count')
            ->limit(10)
            ->get()
            ->toArray();
    }

    public function getNew(): array
    {
        return Channel::where('status', 'active')
            ->orderBy('created_at', 'desc')
            ->withSum('views as viewers_count', 'count')
            ->limit(10)
            ->get()
            ->toArray();
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
}
