<?php

namespace App\Services\Admin;

use App\Models\Stream;
use App\Models\StreamServer;
use App\Services\Flussonic\FlussonicApiService;
use Ramsey\Uuid\Uuid;
use Exception;

class StreamService
{
    private const ALLOWED_SORTS = ['id', 'stream_name', 'created_at', 'health_status', 'current_viewers', 'bitrate', 'status'];

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
                  ->orWhere('stream_key', 'LIKE', "%{$s}%");
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

    public function update(string $uuid, array $data): Stream
    {
        $stream = Stream::where('uuid', $uuid)->whereNull('deleted_at')->firstOrFail();

        $data = $this->resolveServer($data);
        $data = $this->normalizeOutputFormats($data);

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
     * Returns counts: created, updated, skipped (errors per server), errors.
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
        $sampleRaw = null; // first raw stream object for debugging

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
        $data = $this->flussonic->request($server, 'streams', 60);
        // Flussonic v3 returns {"total":N,"streams":[...]} or just an array
        if (isset($data['streams']) && is_array($data['streams'])) {
            return $data['streams'];
        }
        if (is_array($data) && isset($data[0])) {
            return $data;
        }
        return [];
    }

    /**
     * Try every known Flussonic field path for the stream's input URL.
     * Flussonic varies: input.url, input.src, input[0].url, src, input_url, source.
     */
    private function extractInputUrl(array $rs): string
    {
        // Top-level shorthand fields
        foreach (['src', 'input_url', 'source', 'url'] as $key) {
            if (!empty($rs[$key]) && is_string($rs[$key])) return $rs[$key];
        }

        $input = $rs['input'] ?? null;

        if (is_string($input) && $input !== '') return $input;

        if (is_array($input)) {
            // Keyed object: input.url / input.src / input.backup_url
            foreach (['url', 'src', 'backup_url', 'source'] as $key) {
                if (!empty($input[$key]) && is_string($input[$key])) return $input[$key];
            }
            // Array of input objects: input[0].url
            if (isset($input[0]) && is_array($input[0])) {
                foreach (['url', 'src', 'backup_url'] as $key) {
                    if (!empty($input[0][$key]) && is_string($input[0][$key])) return $input[0][$key];
                }
            }
        }

        return '';
    }

    private function upsertStream(StreamServer $server, array $rs, int &$created, int &$updated): void
    {
        $streamKey  = $rs['name'] ?? null;
        if (!$streamKey) return;

        $streamName = $rs['title'] ?? $streamKey;
        $inputUrl   = $this->extractInputUrl($rs);

        $stats   = $rs['stats'] ?? [];
        $bitrate = (int)($stats['bitrate_in'] ?? $stats['bitrate'] ?? $rs['bitrate_in'] ?? 0);
        $viewers = (int)($stats['clients']    ?? $stats['viewers'] ?? $rs['clients']    ?? 0);
        $isAlive = (bool)($stats['alive']     ?? $rs['alive']      ?? false);
        $health  = $isAlive ? 'online' : 'offline';

        $formats = [];
        foreach (['hls', 'dash', 'rtmp', 'webrtc'] as $fmt) {
            if (!empty($rs[$fmt])) $formats[] = $fmt;
        }

        $existing = Stream::where('server_id', $server->id)
            ->where('stream_key', $streamKey)
            ->whereNull('deleted_at')
            ->first();

        if ($existing) {
            $existing->health_status    = $health;
            $existing->bitrate          = $bitrate;
            $existing->current_viewers  = $viewers;
            if (!empty($formats)) $existing->output_formats = $formats;
            $existing->save();
            $updated++;
        } else {
            $stream                  = new Stream();
            $stream->uuid            = Uuid::uuid4()->toString();
            $stream->server_id       = $server->id;
            $stream->stream_name     = $streamName;
            $stream->stream_key      = $streamKey;
            $stream->input_url       = $inputUrl;
            $stream->output_formats  = $formats;
            $stream->health_status   = $health;
            $stream->bitrate         = $bitrate;
            $stream->current_viewers = $viewers;
            $stream->viewer_limit    = 1000;
            $stream->status          = 'active';
            $stream->save();
            $created++;
        }
    }
}
