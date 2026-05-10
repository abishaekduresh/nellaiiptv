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
                  ->orWhere('server_code', 'LIKE', "%{$search}%")
                  ->orWhere('host_ipv4', 'LIKE', "%{$search}%")
                  ->orWhere('provider_name', 'LIKE', "%{$search}%");
            });
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['health_status'])) {
            $query->where('health_status', $filters['health_status']);
        }

        if (!empty($filters['server_type'])) {
            $query->where('server_type', $filters['server_type']);
        }

        if (!empty($filters['provider_name'])) {
            $query->where('provider_name', 'LIKE', "%{$filters['provider_name']}%");
        }

        $sortBy    = $filters['sort_by']    ?? 'id';
        $sortOrder = $filters['sort_order'] ?? 'desc';

        $allowedSorts = ['id', 'server_name', 'created_at', 'status', 'health_status', 'expiry_at'];
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
        // Encrypt plaintext password before persisting
        if (!empty($data['mist_server_password'])) {
            $data['mist_server_password'] = EncryptionHelper::encrypt($data['mist_server_password']);
        }

        $server = new StreamServer();
        $server->uuid = Uuid::uuid4()->toString();
        $server->fill($data);
        $server->save();

        return $server->fresh();
    }

    public function update(string $uuid, array $data): StreamServer
    {
        $server = StreamServer::where('uuid', $uuid)->whereNull('deleted_at')->firstOrFail();

        // If password provided, encrypt; if empty/absent, preserve existing encrypted value
        if (!empty($data['mist_server_password'])) {
            $data['mist_server_password'] = EncryptionHelper::encrypt($data['mist_server_password']);
        } else {
            unset($data['mist_server_password']);
        }

        $server->fill($data);
        $server->save();

        return $server->fresh();
    }

    public function delete(string $uuid): bool
    {
        $server = StreamServer::where('uuid', $uuid)->whereNull('deleted_at')->firstOrFail();
        $server->deleted_at = now();
        $server->status = 'deleted';
        return $server->save();
    }
}
