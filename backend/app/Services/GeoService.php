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
        return Language::where('status', $status)
            ->orderBy('order_number', 'ASC')
            ->get()
            ->toArray();
    }

    public function getCategories(string $status = 'active'): array
    {
        return Category::where('status', $status)
            ->orderBy('order_number', 'ASC')
            ->get()
            ->toArray();
    }
}
