<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\Customer;
use App\Models\StreamClient;
use App\Services\Admin\StreamService;
use App\Helpers\ResponseFormatter;
use Exception;
use Psr\Log\LoggerInterface;

class CustomerStreamController
{
    private StreamService $streamService;
    private LoggerInterface $logger;

    public function __construct(StreamService $streamService, LoggerInterface $logger)
    {
        $this->streamService = $streamService;
        $this->logger        = $logger;
    }

    public function getMyStreams(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');
        try {
            $customer = Customer::where('uuid', $user->sub)->firstOrFail();
            $rows     = $customer->assignedStreams()->get();

            // If the client requests a live sync, pull fresh data from Flussonic
            // for only this customer's assigned streams, then re-fetch from DB.
            if (!empty($request->getQueryParams()['sync'])) {
                $this->streamService->refreshAssignedStreams($rows->pluck('id')->toArray());
                $rows = $customer->assignedStreams()->get();
            }

            $data = $rows->map(function ($s) {
                // Fetch latest 20 client sessions per stream — select * so optional
                // geo columns missing on older DB schemas don't break the query.
                try {
                    $clients = $s->clients()
                        ->orderByDesc('opened_at')
                        ->limit(20)
                        ->get();

                    // Enrich any sessions that are still missing geo data
                    $clients = $this->enrichMissingGeo($clients);
                } catch (Exception $ce) {
                    $this->logger->error('getMyStreams: client session query failed for stream ' . $s->uuid . ': ' . $ce->getMessage());
                    $clients = collect();
                }

                return [
                    'uuid'             => $s->uuid,
                    'stream_name'      => $s->stream_name,
                    'health_status'    => $s->health_status,
                    'stream_status'    => $s->stream_status,
                    'status'           => $s->status,
                    'published_via'    => $s->published_via,
                    'published_from'   => $s->published_from,
                    'uptime'           => $s->uptime,
                    'online_clients'   => $s->online_clients,
                    'max_sessions'     => $s->max_sessions,
                    'client_count'     => $s->client_count,
                    'inputs_bandwidth' => $s->inputs_bandwidth,
                    'out_bandwidth'    => $s->out_bandwidth,
                    'video_codec'      => $s->video_codec,
                    'video_width'      => $s->video_width,
                    'video_height'     => $s->video_height,
                    'fps'              => $s->fps,
                    'audio_codec'      => $s->audio_codec,
                    'audio_bitrate'    => $s->audio_bitrate,
                    'audio_sample_rate'=> $s->audio_sample_rate,
                    'audio_channels'   => $s->audio_channels,
                    'assigned_at'      => $s->pivot->assigned_at,
                    'clients'          => $clients->map(fn($c) => [
                        'uuid'           => $c->uuid,
                        'ip'             => $c->ip,
                        'user_agent'     => $c->user_agent,
                        'protocol'       => $c->protocol,
                        'opened_at'      => $c->opened_at,
                        'closed_at'      => $c->closed_at,
                        'country'        => $c->country,
                        'ip_type'        => $c->ip_type,
                        'continent'      => $c->continent,
                        'continent_code' => $c->continent_code,
                        'country_code'   => $c->country_code,
                        'region'         => $c->region,
                        'region_code'    => $c->region_code,
                        'city'           => $c->city,
                        'latitude'       => $c->latitude,
                        'longitude'      => $c->longitude,
                        'postal'         => $c->postal,
                        'org'            => $c->org,
                        'isp'            => $c->isp,
                        'domain'         => $c->domain,
                    ])->values(),
                ];
            });

            return ResponseFormatter::success($response, $data, 'Streams retrieved');
        } catch (Exception $e) {
            $this->logger->error('getMyStreams failed for user ' . ($user->sub ?? 'unknown') . ': ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            return ResponseFormatter::error($response, 'Failed to load streams: ' . $e->getMessage(), 500);
        }
    }

    /**
     * For any client session where city is null, call ipwho.is to fetch geo data,
     * persist it back to stream_clients, and update the model in-place.
     */
    private function enrichMissingGeo($clients)
    {
        // Collect unique public IPs that are missing geo data
        $needsGeo = $clients->filter(fn($c) => $c->ip && $c->city === null);

        if ($needsGeo->isEmpty()) return $clients;

        $uniqueIPs = $needsGeo->pluck('ip')->unique()->filter(fn($ip) => !$this->isPrivateIp($ip))->values()->toArray();

        if (empty($uniqueIPs)) return $clients;

        $geoCache = $this->geocodeIPs($uniqueIPs);

        if (empty($geoCache)) return $clients;

        // Apply geo data to matching client models and persist
        foreach ($clients as $client) {
            if ($client->ip === null || $client->city !== null) continue;
            $geo = $geoCache[$client->ip] ?? null;
            if (!$geo) continue;

            $client->ip_type        = $geo['ip_type']        ?? null;
            $client->continent      = $geo['continent']      ?? null;
            $client->continent_code = $geo['continent_code'] ?? null;
            $client->country        = $geo['country']        ?? $client->country;
            $client->country_code   = $geo['country_code']   ?? null;
            $client->region         = $geo['region']         ?? null;
            $client->region_code    = $geo['region_code']    ?? null;
            $client->city           = $geo['city']           ?? null;
            $client->latitude       = isset($geo['latitude'])  ? (float)$geo['latitude']  : null;
            $client->longitude      = isset($geo['longitude']) ? (float)$geo['longitude'] : null;
            $client->postal         = $geo['postal']         ?? null;
            $client->org            = $geo['org']            ?? null;
            $client->isp            = $geo['isp']            ?? null;
            $client->domain         = $geo['domain']         ?? null;

            // Persist back so next read doesn't need to geocode again
            StreamClient::where('uuid', $client->uuid)->update([
                'ip_type'        => $client->ip_type,
                'continent'      => $client->continent,
                'continent_code' => $client->continent_code,
                'country'        => $client->country,
                'country_code'   => $client->country_code,
                'region'         => $client->region,
                'region_code'    => $client->region_code,
                'city'           => $client->city,
                'latitude'       => $client->latitude,
                'longitude'      => $client->longitude,
                'postal'         => $client->postal,
                'org'            => $client->org,
                'isp'            => $client->isp,
                'domain'         => $client->domain,
            ]);
        }

        return $clients;
    }

    /**
     * Concurrently geocode IPs via ipwho.is using curl_multi.
     */
    private function geocodeIPs(array $ips): array
    {
        $multi   = curl_multi_init();
        $handles = [];

        foreach ($ips as $ip) {
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
                'ip_type'        => $data['type']                    ?? null,
                'continent'      => $data['continent']               ?? null,
                'continent_code' => $data['continent_code']          ?? null,
                'country'        => $data['country']                 ?? null,
                'country_code'   => $data['country_code']            ?? null,
                'region'         => $data['region']                  ?? null,
                'region_code'    => $data['region_code']             ?? null,
                'city'           => $data['city']                    ?? null,
                'latitude'       => isset($data['latitude'])  ? (float)$data['latitude']  : null,
                'longitude'      => isset($data['longitude']) ? (float)$data['longitude'] : null,
                'postal'         => $data['postal']                  ?? null,
                'org'            => $data['connection']['org']       ?? null,
                'isp'            => $data['connection']['isp']       ?? null,
                'domain'         => $data['connection']['domain']    ?? null,
            ];
        }

        curl_multi_close($multi);
        return $results;
    }

    private function isPrivateIp(string $ip): bool
    {
        return filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false;
    }

    public function toggleStream(Request $request, Response $response, string $streamUuid): Response
    {
        $user = $request->getAttribute('user');
        try {
            $customer = Customer::where('uuid', $user->sub)->firstOrFail();

            $assigned = $customer->assignedStreams()->where('streams.uuid', $streamUuid)->exists();
            if (!$assigned) {
                return ResponseFormatter::error($response, 'Stream not assigned to your account', 403);
            }

            $body   = $request->getParsedBody() ?? [];
            $enable = filter_var($body['enable'] ?? true, FILTER_VALIDATE_BOOLEAN);

            $stream = $this->streamService->toggleStream($streamUuid, $enable);

            return ResponseFormatter::success($response, [
                'uuid'   => $stream->uuid,
                'status' => $stream->status,
            ], $enable ? 'Stream enabled' : 'Stream disabled');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }
}
