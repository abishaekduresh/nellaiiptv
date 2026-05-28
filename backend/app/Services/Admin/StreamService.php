<?php

namespace App\Services\Admin;

use App\Models\Stream;
use App\Models\StreamServer;
use Ramsey\Uuid\Uuid;
use Exception;

class StreamService
{
    private const ALLOWED_SORTS = ['id', 'stream_name', 'created_at', 'health_status', 'current_viewers', 'bitrate', 'status'];

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
}
