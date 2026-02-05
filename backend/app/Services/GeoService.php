<?php

namespace App\Services;

use App\Models\State;
use App\Models\District;
use App\Models\Language;
use App\Models\Category;

class GeoService
{
    public function getStates(): array
    {
        return State::all()->toArray();
    }

    public function getDistricts(): array
    {
        return District::all()->toArray();
    }

    public function getLanguages(string $status = 'active'): array
    {
        $query = Language::query();
        
        // If status is empty or 'all', don't filter by status
        // Status column missing in DB, removing filter
        if (!empty($status) && $status !== 'all') {
           $query->where('status', $status);
        }
        
        return $query->orderBy('order_number', 'ASC')
            ->get()
            ->toArray();
    }

    public function getCategories(string $status = 'active'): array
    {
        $query = Category::query();
        
        // If status is empty or 'all', don't filter by status
        // Status column missing in DB, removing filter
        if (!empty($status) && $status !== 'all') {
           $query->where('status', $status);
        }
        
        return $query->orderBy('order_number', 'ASC')
            ->get()
            ->toArray();
    }
}
