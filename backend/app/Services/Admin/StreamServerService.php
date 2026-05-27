<?php

namespace App\Services\Admin;

use App\Helpers\EncryptionHelper;
use App\Models\StreamServer;
use Ramsey\Uuid\Uuid;

class StreamServerService
{
    public function getAll(array $filters = []): array
    {
        $query = StreamServer::whereNull('deleted_at');

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('server_name', 'LIKE', "%{$search}%")
                  ->orWhere('server_host_ip', 'LIKE', "%{$search}%")
                  ->orWhere('server_host_domain', 'LIKE', "%{$search}%")
                  ->orWhere('region', 'LIKE', "%{$search}%");
            });
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['health_status'])) {
            $query->where('health_status', $filters['health_status']);
        }

        if (!empty($filters['region'])) {
            $query->where('region', 'LIKE', "%{$filters['region']}%");
        }

        $sortBy    = $filters['sort_by']    ?? 'id';
        $sortOrder = $filters['sort_order'] ?? 'desc';

        $allowedSorts = ['id', 'server_name', 'created_at', 'status', 'health_status', 'last_ping_at', 'region'];
        if (!in_array($sortBy, $allowedSorts)) $sortBy = 'id';
        if (!in_array(strtolower($sortOrder), ['asc', 'desc'])) $sortOrder = 'desc';

        $perPage = (int)($filters['per_page'] ?? 20);

        return $query->orderBy($sortBy, $sortOrder)->paginate($perPage)->toArray();
    }

    public function getOne(string $uuid): StreamServer
    {
        return StreamServer::where('uuid', $uuid)->whereNull('deleted_at')->firstOrFail();
    }

    public function create(array $data): StreamServer
    {
        if (!empty($data['password_encrypted'])) {
            $data['password_encrypted'] = EncryptionHelper::encrypt($data['password_encrypted']);
        }

        if (!empty($data['bearer_token'])) {
            $data['bearer_token'] = EncryptionHelper::encrypt($data['bearer_token']);
        }

        $server       = new StreamServer();
        $server->uuid = Uuid::uuid4()->toString();
        $server->fill($data);
        $server->save();

        return $server->fresh();
    }

    public function update(string $uuid, array $data): StreamServer
    {
        $server = StreamServer::where('uuid', $uuid)->whereNull('deleted_at')->firstOrFail();

        if (!empty($data['password_encrypted'])) {
            $data['password_encrypted'] = EncryptionHelper::encrypt($data['password_encrypted']);
        } else {
            unset($data['password_encrypted']);
        }

        if (array_key_exists('bearer_token', $data)) {
            if (!empty($data['bearer_token'])) {
                $data['bearer_token'] = EncryptionHelper::encrypt($data['bearer_token']);
            } else {
                // Empty string sent → clear the token
                $data['bearer_token'] = null;
            }
        }

        $server->fill($data);
        $server->save();

        return $server->fresh();
    }

    public function delete(string $uuid): bool
    {
        $server = StreamServer::where('uuid', $uuid)->whereNull('deleted_at')->firstOrFail();
        $server->deleted_at = now();
        $server->status     = 'deleted';
        return $server->save();
    }
}
