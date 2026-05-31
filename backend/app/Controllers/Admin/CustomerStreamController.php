<?php

namespace App\Controllers\Admin;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\Customer;
use App\Models\Stream;
use App\Helpers\ResponseFormatter;
use Exception;

class CustomerStreamController
{
    public function getStreams(Request $request, Response $response, string $uuid): Response
    {
        try {
            $customer = Customer::where('uuid', $uuid)->firstOrFail();
            $rows = $customer->assignedStreams()->get();

            $data = $rows->map(fn($s) => [
                'uuid'          => $s->uuid,
                'stream_name'   => $s->stream_name,
                'stream_status' => $s->stream_status,
                'published_via' => $s->published_via,
                'uptime'        => $s->uptime,
                'status'        => $s->status,
                'assigned_at'   => $s->pivot->assigned_at,
            ]);

            return ResponseFormatter::success($response, $data, 'Assigned streams retrieved');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, 'Customer not found', 404);
        }
    }

    public function assignStream(Request $request, Response $response, string $uuid, string $streamUuid): Response
    {
        try {
            $customer = Customer::where('uuid', $uuid)->firstOrFail();
            $stream   = Stream::where('uuid', $streamUuid)->firstOrFail();

            if ($customer->assignedStreams()->where('streams.id', $stream->id)->exists()) {
                return ResponseFormatter::error($response, 'Stream already assigned', 409);
            }

            $customer->assignedStreams()->attach($stream->id, [
                'assigned_at' => date('Y-m-d H:i:s'),
            ]);

            return ResponseFormatter::success($response, null, 'Stream assigned', 201);
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }

    public function unassignStream(Request $request, Response $response, string $uuid, string $streamUuid): Response
    {
        try {
            $customer = Customer::where('uuid', $uuid)->firstOrFail();
            $stream   = Stream::where('uuid', $streamUuid)->firstOrFail();

            $customer->assignedStreams()->detach($stream->id);

            return ResponseFormatter::success($response, null, 'Stream unassigned');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }
}
