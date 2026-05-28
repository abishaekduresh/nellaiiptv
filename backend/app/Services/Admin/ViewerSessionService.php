<?php

namespace App\Services\Admin;

use App\Models\ViewerSession;
use App\Models\Stream;

class ViewerSessionService
{
    public function getAll(array $filters = []): array
    {
        $query = ViewerSession::with('stream:id,uuid,stream_name');

        if (!empty($filters['stream_uuid'])) {
            $stream = Stream::where('uuid', $filters['stream_uuid'])->first();
            if ($stream) $query->where('stream_id', $stream->id);
        }

        if (!empty($filters['protocol'])) {
            $query->where('protocol', $filters['protocol']);
        }

        if (!empty($filters['country'])) {
            $query->where('country', 'LIKE', "%{$filters['country']}%");
        }

        if (!empty($filters['search'])) {
            $s = $filters['search'];
            $query->where(function ($q) use ($s) {
                $q->where('ip_address', 'LIKE', "%{$s}%")
                  ->orWhere('country', 'LIKE', "%{$s}%")
                  ->orWhere('session_id', 'LIKE', "%{$s}%");
            });
        }

        $perPage = max(1, (int)($filters['per_page'] ?? 30));

        return $query->orderBy('started_at', 'desc')->paginate($perPage)->toArray();
    }

    public function create(array $data): ViewerSession
    {
        if (!empty($data['stream_uuid'])) {
            $stream = Stream::where('uuid', $data['stream_uuid'])
                ->whereNull('deleted_at')
                ->firstOrFail();
            $data['stream_id'] = $stream->id;
            unset($data['stream_uuid']);
        }

        $data['started_at'] = $data['started_at'] ?? date('Y-m-d H:i:s');

        return ViewerSession::updateOrCreate(
            ['session_id' => $data['session_id']],
            $data
        );
    }
}
