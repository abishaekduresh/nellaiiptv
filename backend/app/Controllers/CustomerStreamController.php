<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\Customer;
use App\Services\Admin\StreamService;
use App\Helpers\ResponseFormatter;
use Exception;

class CustomerStreamController
{
    private StreamService $streamService;

    public function __construct(StreamService $streamService)
    {
        $this->streamService = $streamService;
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
                // Fetch latest 20 client sessions per stream
                $clients = $s->clients()
                    ->orderByDesc('opened_at')
                    ->limit(20)
                    ->get([
                        'uuid', 'ip', 'user_agent', 'protocol', 'opened_at', 'closed_at',
                        'country', 'ip_type', 'continent', 'continent_code', 'country_code',
                        'region', 'region_code', 'city', 'latitude', 'longitude',
                        'postal', 'org', 'isp', 'domain',
                    ])
                    ->map(fn($c) => [
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
                    ])->values();

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
                    'clients'          => $clients,
                ];
            });

            return ResponseFormatter::success($response, $data, 'Streams retrieved');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, 'Failed to load streams', 500);
        }
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
