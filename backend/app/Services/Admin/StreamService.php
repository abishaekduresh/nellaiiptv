<?php

namespace App\Services\Admin;

use App\Models\Stream;
use App\Models\StreamClient;
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
        $stream->deleted_at = date('Y-m-d H:i:s');
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
     * Enable or disable a stream on its Flussonic server, then update the local DB status.
     * Uses PUT /streamer/api/v3/streams/{encoded_name} with {"disabled": true/false}.
     * Stream names containing "/" are URL-encoded as per Flussonic docs (live/foo → live%2Ffoo).
     */
    public function toggleStream(string $uuid, bool $enable): Stream
    {
        $stream = Stream::where('uuid', $uuid)->whereNull('deleted_at')->firstOrFail();
        $server = $stream->server;
        if (!$server) throw new Exception('Stream has no associated server.');

        $encodedName = str_replace('/', '%2F', $stream->stream_name);
        $this->flussonic->requestPut($server, "streams/{$encodedName}", ['disabled' => !$enable]);

        $stream->status = $enable ? 'active' : 'inactive';
        $stream->save();

        return $stream->fresh();
    }

    public function getClients(string $uuid): array
    {
        $stream = Stream::where('uuid', $uuid)->whereNull('deleted_at')->firstOrFail();
        return StreamClient::where('stream_id', $stream->id)
            ->orderByDesc('opened_at')
            ->limit(200)
            ->get()
            ->toArray();
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

        $created     = 0;
        $updated     = 0;
        $deactivated = 0;
        $clients     = 0;
        $errors      = [];
        $sampleRaw   = null;

        foreach ($servers as $server) {
            try {
                $remoteStreams = $this->fetchFlussonicStreams($server);
                if ($sampleRaw === null && !empty($remoteStreams)) {
                    $sampleRaw = $remoteStreams[0];
                }

                $seenNames = [];
                foreach ($remoteStreams as $rs) {
                    $name = $rs['name'] ?? null;
                    if ($name) $seenNames[] = $name;
                    $this->upsertStream($server, $rs, $created, $updated);
                }

                // Streams present in DB but absent from Flussonic response → deleted
                if (!empty($seenNames)) {
                    $deactivated += $this->markAbsentAsDeleted($server, $seenNames);
                }

                // Sync active sessions into stream_clients
                $clients += $this->syncSessionsFromServer($server);
            } catch (Exception $e) {
                $errors[] = "[{$server->server_name}] {$e->getMessage()}";
            }
        }

        return compact('created', 'updated', 'deactivated', 'clients', 'errors', 'sampleRaw');
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

    /**
     * Extract stream uptime in seconds from Flussonic stats.
     * Tries: stats.lifetime → stats.uptime / alive_time / run_time → stats.start_time (compute elapsed).
     * Returns null if the stream is not alive or no usable field is found.
     */
    private function extractUptime(array $stats, bool $isAlive): ?int
    {
        if (!$isAlive) return null;

        // Flussonic v3 canonical field
        if (isset($stats['lifetime']) && $stats['lifetime'] > 0) {
            return (int)$stats['lifetime'];
        }

        // Alternative direct uptime fields
        foreach (['uptime', 'alive_time', 'run_time', 'running_time'] as $key) {
            if (isset($stats[$key]) && $stats[$key] > 0) {
                return (int)$stats[$key];
            }
        }

        // start_time is a Unix epoch timestamp — compute elapsed seconds
        if (isset($stats['start_time']) && $stats['start_time'] > 0) {
            $elapsed = time() - (int)$stats['start_time'];
            return $elapsed > 0 ? $elapsed : null;
        }

        return null;
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
        $isDisabled  = !empty($rs['disabled']);

        $data = [
            'stream_key'        => $streamName,
            'input_url'         => $inputUrl !== '' ? $inputUrl : 'publish://',
            'output_formats'    => [],
            'status'            => $isDisabled ? 'inactive' : 'active',
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
            // Uptime in seconds. Flussonic v3 may expose it directly as stats.uptime,
            // or as stats.start_time (Unix epoch) — compute elapsed from that.
            // Also fall back to stats.alive_time / stats.run_time for older builds.
            'uptime'            => $this->extractUptime($stats, $isAlive),
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
            $stream->fill($data);
            $stream->save();
            $created++;
        }
    }

    /**
     * Pull active sessions from /streamer/api/v3/sessions, wipe previous records
     * for this server's streams, then insert the fresh snapshot.
     * Returns the number of sessions inserted.
     */
    private function syncSessionsFromServer(StreamServer $server): int
    {
        $data = $this->flussonic->request($server, 'sessions', 60);

        $sessions = [];
        if (isset($data['sessions']) && is_array($data['sessions'])) {
            $sessions = $data['sessions'];
        } elseif (is_array($data) && isset($data[0])) {
            $sessions = $data;
        }

        // Wipe all previous clients for this server's streams
        $serverStreamNames = Stream::where('server_id', $server->id)
            ->whereNull('deleted_at')
            ->pluck('stream_name')
            ->toArray();

        if (!empty($serverStreamNames)) {
            StreamClient::whereIn('stream_name', $serverStreamNames)->delete();
        }

        if (empty($sessions)) return 0;

        // Build stream_name → stream_id map for this server (avoid N+1)
        $sessionNames = array_unique(array_filter(array_column($sessions, 'name')));
        $streamMap    = Stream::where('server_id', $server->id)
            ->whereIn('stream_name', $sessionNames)
            ->whereNull('deleted_at')
            ->pluck('id', 'stream_name')
            ->toArray();

        // Geocode all unique public IPs concurrently via ipwho.is
        $uniqueIPs = array_values(array_unique(array_filter(array_column($sessions, 'ip'))));
        $geoCache  = $this->geocodeIPs($uniqueIPs);

        $count = 0;
        foreach ($sessions as $session) {
            $ip  = $session['ip'] ?? null;
            $geo = ($ip !== null && isset($geoCache[$ip])) ? $geoCache[$ip] : [];
            $this->insertStreamClient($streamMap, $session, $geo);
            $count++;
        }
        return $count;
    }

    private function insertStreamClient(array $streamMap, array $session, array $geo = []): void
    {
        $sessionUuid = $session['id'] ?? null;
        $streamName  = $session['name'] ?? null;
        if (!$sessionUuid || !$streamName) return;

        $client                 = new StreamClient();
        $client->uuid           = $sessionUuid;
        $client->stream_id      = $streamMap[$streamName] ?? null;
        $client->stream_name    = $streamName;
        $client->ip             = $session['ip'] ?? null;
        $client->user_agent     = $session['user_agent'] ?? null;
        $client->protocol       = $session['proto'] ?? $session['protocol'] ?? null;
        $client->opened_at      = isset($session['opened_at']) ? (int)$session['opened_at'] : null;
        $client->closed_at      = isset($session['closed_at']) ? (int)$session['closed_at'] : null;

        // Prefer ipwho.is enriched data; fall back to whatever Flussonic provides
        $client->country        = $geo['country']        ?? $session['country'] ?? null;
        $client->ip_type        = $geo['ip_type']        ?? null;
        $client->continent      = $geo['continent']      ?? null;
        $client->continent_code = $geo['continent_code'] ?? null;
        $client->country_code   = $geo['country_code']   ?? null;
        $client->region         = $geo['region']         ?? null;
        $client->region_code    = $geo['region_code']    ?? null;
        $client->city           = $geo['city']           ?? null;
        $client->latitude       = $geo['latitude']       ?? null;
        $client->longitude      = $geo['longitude']      ?? null;
        $client->postal         = $geo['postal']         ?? null;
        $client->org            = $geo['org']            ?? null;
        $client->isp            = $geo['isp']            ?? null;
        $client->domain         = $geo['domain']         ?? null;
        $client->save();
    }

    /**
     * Concurrently geocode a list of IPs via ipwho.is using curl_multi.
     * Private/reserved IPs are skipped. Returns ip → geo array map.
     */
    private function geocodeIPs(array $ips): array
    {
        $public = array_values(array_unique(array_filter(
            $ips,
            fn($ip) => $ip && !$this->isPrivateIp($ip)
        )));

        if (empty($public)) return [];

        $multi   = curl_multi_init();
        $handles = [];

        foreach ($public as $ip) {
            $ch = curl_init("https://ipwho.is/{$ip}");
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT        => 10,
                CURLOPT_CONNECTTIMEOUT => 5,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_HTTPHEADER     => ['Accept: application/json'],
                CURLOPT_USERAGENT      => 'NellaiIPTV/1.0',
            ]);
            curl_multi_add_handle($multi, $ch);
            $handles[$ip] = $ch;
        }

        $running = 0;
        do {
            $status = curl_multi_exec($multi, $running);
            if ($status > CURLM_OK) break;
            if ($running > 0) curl_multi_select($multi, 1.0);
        } while ($running > 0);

        $results = [];
        foreach ($handles as $ip => $ch) {
            $raw = curl_multi_getcontent($ch);
            curl_multi_remove_handle($multi, $ch);
            curl_close($ch);

            if (!$raw) continue;
            $data = json_decode($raw, true);
            if (!isset($data['success']) || !$data['success']) continue;

            $results[$ip] = [
                'ip_type'        => $data['type']              ?? null,
                'continent'      => $data['continent']         ?? null,
                'continent_code' => $data['continent_code']    ?? null,
                'country'        => $data['country']           ?? null,
                'country_code'   => $data['country_code']      ?? null,
                'region'         => $data['region']            ?? null,
                'region_code'    => $data['region_code']       ?? null,
                'city'           => $data['city']              ?? null,
                'latitude'       => isset($data['latitude'])   ? (float)$data['latitude']  : null,
                'longitude'      => isset($data['longitude'])  ? (float)$data['longitude'] : null,
                'postal'         => $data['postal']            ?? null,
                'org'            => $data['connection']['org']    ?? null,
                'isp'            => $data['connection']['isp']    ?? null,
                'domain'         => $data['connection']['domain'] ?? null,
            ];
        }

        curl_multi_close($multi);
        return $results;
    }

    private function isPrivateIp(string $ip): bool
    {
        return filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false;
    }

    /**
     * Mark streams belonging to this server that were NOT returned by the Flussonic
     * response as deleted (soft-delete + status=deleted).
     * Safety guard: only runs when $seenNames is non-empty to avoid wiping
     * everything if the API returned an unexpectedly empty list.
     */
    private function markAbsentAsDeleted(StreamServer $server, array $seenNames): int
    {
        return (int) Stream::where('server_id', $server->id)
            ->whereNull('deleted_at')
            ->whereNotIn('stream_name', $seenNames)
            ->update([
                'status'     => 'deleted',
                'deleted_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ]);
    }

    /**
     * Pull live Flussonic data for a specific set of stream IDs and update the DB.
     * Called when a customer triggers a manual sync. Groups by server to batch
     * the session pull, then refreshes each stream individually.
     */
    public function refreshAssignedStreams(array $streamIds): void
    {
        if (empty($streamIds)) return;

        $streams = Stream::with('server')
            ->whereIn('id', $streamIds)
            ->whereNull('deleted_at')
            ->get();

        // Group streams by server
        $byServer = [];
        foreach ($streams as $stream) {
            if (!$stream->server) continue;
            $byServer[$stream->server_id][] = $stream;
        }

        foreach ($byServer as $serverStreams) {
            $server = $serverStreams[0]->server;

            // Refresh each stream's live stats
            foreach ($serverStreams as $stream) {
                try {
                    $encodedName = str_replace('/', '%2F', $stream->stream_name);
                    $rs = $this->flussonic->request($server, "streams/{$encodedName}", 10);
                    if (empty($rs)) continue;
                    // Single-stream endpoint returns the object directly; ensure name is set
                    if (empty($rs['name'])) $rs['name'] = $stream->stream_name;
                    $dummy = 0;
                    $this->upsertStream($server, $rs, $dummy, $dummy);
                } catch (Exception $e) {
                    // Mark offline if Flussonic can't be reached for this stream
                    $stream->health_status = 'offline';
                    $stream->save();
                }
            }

            // Refresh client sessions for only these streams
            try {
                $names = array_map(fn($s) => $s->stream_name, $serverStreams);
                $this->syncSessionsForStreams($server, $names);
            } catch (Exception $e) {
                // Non-fatal — stream stats are already updated above
            }
        }
    }

    /**
     * Pull sessions from Flussonic and sync only for the given stream names.
     * Deletes existing clients for those streams then re-inserts the fresh snapshot.
     */
    private function syncSessionsForStreams(StreamServer $server, array $streamNames): void
    {
        if (empty($streamNames)) return;

        $data     = $this->flussonic->request($server, 'sessions', 30);
        $sessions = $data['sessions'] ?? (isset($data[0]) ? $data : []);

        $streamMap = Stream::where('server_id', $server->id)
            ->whereIn('stream_name', $streamNames)
            ->whereNull('deleted_at')
            ->pluck('id', 'stream_name')
            ->toArray();

        // Filter to only the sessions belonging to requested streams
        $filtered = array_filter($sessions, function ($s) use ($streamNames) {
            $name = $s['name'] ?? null;
            return $name && in_array($name, $streamNames);
        });

        // Geocode all unique public IPs concurrently
        $uniqueIPs = array_values(array_unique(array_filter(array_column($filtered, 'ip'))));
        $geoCache  = $this->geocodeIPs($uniqueIPs);

        // Wipe only the client records for these streams, then re-insert
        StreamClient::whereIn('stream_name', $streamNames)->delete();

        foreach ($filtered as $session) {
            $ip  = $session['ip'] ?? null;
            $geo = ($ip !== null && isset($geoCache[$ip])) ? $geoCache[$ip] : [];
            $this->insertStreamClient($streamMap, $session, $geo);
        }
    }
}
