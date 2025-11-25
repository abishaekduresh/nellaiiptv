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
        $query = Channel::with(['state', 'district', 'language']);

        if (isset($filters['state_id'])) {
            $query->where('state_id', $filters['state_id']);
        }

        if (isset($filters['language_id'])) {
            $query->where('language_id', $filters['language_id']);
        }

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $perPage = $filters['per_page'] ?? 20;
        return $query->paginate($perPage)->toArray();
    }

    public function create(array $data): Channel
    {
        $channel = new Channel();
        $channel->uuid = Uuid::uuid7()->toString();
        $channel->fill($data);
        $channel->save();

        return $channel->load(['state', 'district', 'language']);
    }

    public function update(string $uuid, array $data): Channel
    {
        $channel = Channel::where('uuid', $uuid)->firstOrFail();
        $channel->fill($data);
        $channel->save();

        return $channel->load(['state', 'district', 'language']);
    }

    public function delete(string $uuid): bool
    {
        $channel = Channel::where('uuid', $uuid)->firstOrFail();
        return $channel->delete();
    }

    public function search(array $params): array
    {
        $query = Channel::with(['state', 'district', 'language']);

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
