<?php

namespace App\Services\Admin;

use App\Models\Tenant;
use Ramsey\Uuid\Uuid;

class TenantService
{
    public function getAll(array $filters = []): array
    {
        $query = Tenant::whereNull('deleted_at');

        if (!empty($filters['search'])) {
            $s = $filters['search'];
            $query->where(function ($q) use ($s) {
                $q->where('company_name', 'LIKE', "%{$s}%")
                  ->orWhere('email', 'LIKE', "%{$s}%");
            });
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $perPage = max(1, (int)($filters['per_page'] ?? 20));

        return $query->orderBy('id', 'desc')->paginate($perPage)->toArray();
    }

    public function getOne(string $uuid): Tenant
    {
        return Tenant::where('uuid', $uuid)->whereNull('deleted_at')->firstOrFail();
    }

    public function create(array $data): Tenant
    {
        $data = $this->normalizeJsonFields($data);

        $tenant       = new Tenant();
        $tenant->uuid = Uuid::uuid4()->toString();
        $tenant->fill($data);
        $tenant->save();

        return $tenant->fresh();
    }

    public function update(string $uuid, array $data): Tenant
    {
        $tenant = Tenant::where('uuid', $uuid)->whereNull('deleted_at')->firstOrFail();

        $data = $this->normalizeJsonFields($data);

        $tenant->fill($data);
        $tenant->save();

        return $tenant->fresh();
    }

    public function delete(string $uuid): bool
    {
        $tenant = Tenant::where('uuid', $uuid)->whereNull('deleted_at')->firstOrFail();
        $tenant->deleted_at = now();
        $tenant->status     = 'deleted';
        return $tenant->save();
    }

    private function normalizeJsonFields(array $data): array
    {
        foreach (['allowed_servers', 'channel_id'] as $field) {
            if (isset($data[$field]) && is_string($data[$field])) {
                $data[$field] = json_decode($data[$field], true) ?? [];
            }
        }
        return $data;
    }
}
