<?php

namespace App\Services\Admin;

use App\Models\Stream;
use App\Models\StreamServer;
use App\Services\Flussonic\FlussonicApiService;
use Ramsey\Uuid\Uuid;
use Exception;

class StreamService
{
    private const ALLOWED_SORTS = [
        'id', 'stream_name', 'created_at', 'health_status', 'stream_status',
        'current_viewers', 'online_clients', 'bitrate', 'out_bandwidth', 'status',
    ];

    private FlussonicApiService $flussonic;

    public function __construct(FlussonicApiService $flussonic)
    {
        $this->flussonic = $flussonic;
    }

    public function getAll(array $filters = []): array
    {
        $query = Stream::with('server:id,uuid,server_name,server_host_ip')
            ->whereNull('deleted_at');

        if (!empty($filters['search'])) {
            $s = $filters['search'];
            $query->where(function ($q) use ($s) {
                $q->where('stream_name', 'LIKE', "%{$s}%")
                  ->orWhere('stream_key', 'LIKE', "%{$s}%")
                  ->orWhere('published_from', 'LIKE', "%{$s}%");
            });
        }

        if (!empty($filters['server_uuid'])) {
            $server = StreamServer::where('uuid', $filters['server_uuid'])->first();
            if ($server) $query->where('server_id', $server->id);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['health_status'])) {
            $query->where('health_status', $filters['health_status']);
        }

        if (!empty($filters['stream_status'])) {
            $query->where('stream_status', $filters['stream_status']);
        }

        $sortBy    = in_array($filters['sort_by'] ?? '', self::ALLOWED_SORTS) ? $filters['sort_by'] : 'id';
        $sortOrder = in_array(strtolower($filters['sort_order'] ?? ''), ['asc', 'desc']) ? $filters['sort_order'] : 'desc';
        $perPage   = max(1, (int)($filters['per_page'] ?? 20));

        return $query->orderBy($sortBy, $sortOrder)->paginate($perPage)->toArray();
    }

    public function getOne(string $uuid): Stream
    {
        return Stream::with('server:id,uuid,server_name,server_host_ip,api_port,api_version')
            ->where('uuid', $uuid)
            ->whereNull('deleted_at')
            ->firstOrFail();
    }

    public function create(array $data): Stream
    {
        $data = $this->resolveServer($data);
        $data = $this->normalizeOutputFormats($data);

        $stream       = new Stream();
        $stream->uuid = Uuid::uuid4()->toString();
        $stream->fill($data);
        $stream->save();

        return $stream->fresh()->load('server:id,uuid,server_name');
    }

    public function delete(string $uuid): bool
    {
        $stream = Stream::where('uuid', $uuid)->whereNull('deleted_at')->firstOrFail();
        $stream->deleted_at = now();
        $stream->status     = 'deleted';
        return $stream->save();
    }

    private function resolveServer(array $data): array
    {
        if (!empty($data['server_uuid'])) {
            $server = StreamServer::where('uuid', $data['server_uuid'])
                ->whereNull('deleted_at')
                ->firstOrFail();
            $data['server_id'] = $server->id;
            unset($data['server_uuid']);
        }
        return $data;
    }

    private function normalizeOutputFormats(array $data): array
    {
        if (isset($data['output_formats'])) {
            if (is_string($data['output_formats'])) {
                $data['output_formats'] = json_decode($data['output_formats'], true) ?? [];
            }
        }
        return $data;
    }

    /**
     * Pull streams from one or all active Flussonic servers and upsert into the DB.
     * Uses /streamer/api/v3/streams endpoint.
     * Returns counts: created, updated, errors, sampleRaw.
     */
    public function syncFromServers(?string $serverUuid = null): array
    {
        $query = StreamServer::whereNull('deleted_at')
            ->where('status', 'active')
            ->where('health_status', 'online');
        if ($serverUuid) {
            $query->where('uuid', $serverUuid);
        }
        $servers = $query->get();

        if ($servers->isEmpty()) {
            throw new Exception('No active online stream servers found to sync from.');
        }

        $created   = 0;
        $updated   = 0;
        $errors    = [];
        $sampleRaw = null;

        foreach ($servers as $server) {
            try {
                $remoteStreams = $this->fetchFlussonicStreams($server);
                if ($sampleRaw === null && !empty($remoteStreams)) {
                    $sampleRaw = $remoteStreams[0];
                }
                foreach ($remoteStreams as $rs) {
                    $this->upsertStream($server, $rs, $created, $updated);
                }
            } catch (Exception $e) {
                $errors[] = "[{$server->server_name}] {$e->getMessage()}";
            }
        }

        return compact('created', 'updated', 'errors', 'sampleRaw');
    }

    private function fetchFlussonicStreams(StreamServer $server): array
    {
        // Calls /streamer/api/v3/streams via FlussonicApiService::request()
        $data = $this->flussonic->request($server, 'streams', 60);
        // API v3 returns {"streams":[...], "estimated_count":N, ...}
        if (isset($data['streams']) && is_array($data['streams'])) {
            return $data['streams'];
        }
        // Fallback: bare array
        if (is_array($data) && isset($data[0])) {
            return $data;
        }
        return [];
    }

    /**
     * Extract the input source URL from various Flussonic response shapes.
     */
    private function extractInputUrl(array $rs): string
    {
        // inputs[0].url is the canonical v3 location
        $inputs = $rs['inputs'] ?? null;
        if (is_array($inputs) && isset($inputs[0]['url']) && is_string($inputs[0]['url'])) {
            return $inputs[0]['url'];
        }

        // Top-level shorthand fields (older API versions)
        foreach (['src', 'input_url', 'source', 'url'] as $key) {
            if (!empty($rs[$key]) && is_string($rs[$key])) return $rs[$key];
        }

        $input = $rs['input'] ?? null;
        if (is_string($input) && $input !== '') return $input;
        if (is_array($input)) {
            foreach (['url', 'src', 'backup_url', 'source'] as $key) {
                if (!empty($input[$key]) && is_string($input[$key])) return $input[$key];
            }
        }

        return '';
    }

    private function upsertStream(StreamServer $server, array $rs, int &$created, int &$updated): void
    {
        $streamName = $rs['name'] ?? null;
        if (!$streamName) return;

        $stats    = $rs['stats'] ?? [];
        $isAlive  = (bool)($stats['running'] ?? $stats['alive'] ?? false);
        $health   = $isAlive ? 'online' : 'offline';
        $inputUrl = $this->extractInputUrl($rs);

        // Extract video and audio tracks from media_info
        $tracks     = $stats['media_info']['tracks'] ?? [];
        $videoTrack = null;
        $audioTrack = null;
        foreach ($tracks as $track) {
            $content = $track['content'] ?? '';
            if ($content === 'video' && $videoTrack === null) $videoTrack = $track;
            if ($content === 'audio' && $audioTrack === null) $audioTrack = $track;
        }

        $maxSessions = isset($rs['on_play']['max_sessions']) ? (int)$rs['on_play']['max_sessions'] : null;

        $data = [
            'stream_key'        => $streamName,
            'input_url'         => $inputUrl !== '' ? $inputUrl : 'publish://',
            'output_formats'    => [],
            'health_status'     => $health,
            'current_viewers'   => (int)($stats['online_clients'] ?? $stats['client_count'] ?? 0),
            'bitrate'           => (int)($stats['bitrate'] ?? $stats['input_bitrate'] ?? 0),
            'viewer_limit'      => $maxSessions ?? 1000,
            // Bandwidth
            'inputs_bandwidth'  => (int)($stats['inputs_bandwidth'] ?? 0),
            'out_bandwidth'     => (int)($stats['out_bandwidth'] ?? 0),
            // Clients
            'online_clients'    => (int)($stats['online_clients'] ?? 0),
            'client_count'      => (int)($stats['client_count'] ?? 0),
            // Video track
            'video_width'       => $videoTrack ? (((int)($videoTrack['width']  ?? 0)) ?: null) : null,
            'video_height'      => $videoTrack ? (((int)($videoTrack['height'] ?? 0)) ?: null) : null,
            'video_codec'       => $videoTrack['codec'] ?? null,
            'fps'               => $videoTrack ? (((float)($videoTrack['fps']  ?? 0)) ?: null) : null,
            // Audio track
            'audio_codec'       => $audioTrack['codec'] ?? null,
            'audio_bitrate'     => $audioTrack ? (((int)($audioTrack['bitrate']      ?? 0)) ?: null) : null,
            'audio_sample_rate' => $audioTrack ? (((int)($audioTrack['sample_rate']  ?? 0)) ?: null) : null,
            'audio_channels'    => $audioTrack ? (((int)($audioTrack['channels']     ?? 0)) ?: null) : null,
            // Runtime status
            'stream_status'     => $stats['status'] ?? null,
            'published_via'     => $stats['published_via'] ?? null,
            'published_from'    => $stats['published_from'] ?? null,
            'stream_url_type'   => $stats['url'] ?? null,
            'max_sessions'      => $maxSessions,
        ];

        $existing = Stream::where('server_id', $server->id)
            ->where('stream_name', $streamName)
            ->whereNull('deleted_at')
            ->first();

        if ($existing) {
            $existing->fill($data);
            $existing->save();
            $updated++;
        } else {
            $stream              = new Stream();
            $stream->uuid        = Uuid::uuid4()->toString();
            $stream->server_id   = $server->id;
            $stream->stream_name = $streamName;
            $stream->status      = 'active';
            $stream->fill($data);
            $stream->save();
            $created++;
        }
    }
}
