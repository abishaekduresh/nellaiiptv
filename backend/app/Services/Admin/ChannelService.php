<?php

namespace App\Services\Admin;

use App\Models\Channel;
use App\Models\State;
use App\Models\District;
use App\Models\Language;
use Ramsey\Uuid\Uuid;
use Exception;

class ChannelService
{
    public function getAll(array $filters = []): array
    {
        $query = Channel::with(['state', 'district', 'language', 'category']);

        if (isset($filters['search']) && !empty($filters['search'])) {
            $query->where('name', 'LIKE', '%' . $filters['search'] . '%');
        } elseif (isset($filters['q']) && !empty($filters['q'])) {
             $query->where('name', 'LIKE', '%' . $filters['q'] . '%');
        }

        if (isset($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        if (isset($filters['state_id'])) {
            $query->where('state_id', $filters['state_id']);
        }

        if (isset($filters['language_id'])) {
            $query->where('language_id', $filters['language_id']);
        }

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $sortBy = $filters['sort_by'] ?? 'id';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        
        $allowedSorts = ['id', 'name', 'created_at', 'status', 'channel_number'];
        if (!in_array($sortBy, $allowedSorts)) $sortBy = 'id';
        if (!in_array(strtolower($sortOrder), ['asc', 'desc'])) $sortOrder = 'desc';

        $perPage = $filters['per_page'] ?? 20;
        return $query->orderBy($sortBy, $sortOrder)->paginate($perPage)->toArray();
    }

    public function create(array $data): Channel
    {
        $channel = new Channel();
        $channel->uuid = Uuid::uuid4()->toString();
        $channel->fill($data);
        $channel->save();

        return $channel->load(['state', 'district', 'language', 'category']);
    }

    public function update(string $uuid, array $data): Channel
    {
        $channel = Channel::where('uuid', $uuid)->firstOrFail();
        $channel->fill($data);
        $channel->save();

        return $channel->load(['state', 'district', 'language', 'category']);
    }

    public function delete(string $uuid): bool
    {
        $channel = Channel::where('uuid', $uuid)->firstOrFail();
        return $channel->delete();
    }

    public function getOne(string $uuid): Channel
    {
        return Channel::where('uuid', $uuid)
            ->with(['state', 'district', 'language', 'category'])
            ->firstOrFail();
    }

    public function search(array $params): array
    {
        $query = Channel::with(['state', 'district', 'language', 'category']);

        if (isset($params['q']) && !empty($params['q'])) {
            $query->where('name', 'LIKE', '%' . $params['q'] . '%');
        }

        if (isset($params['state_id'])) {
            $query->where('state_id', $params['state_id']);
        }

        if (isset($params['language_id'])) {
            $query->where('language_id', $params['language_id']);
        }

        if (isset($params['district_id'])) {
            $query->where('district_id', $params['district_id']);
        }

        $perPage = $params['per_page'] ?? 20;
        return $query->paginate($perPage)->toArray();
    }
}
