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

    public function getLanguages(): array
    {
        return Language::orderBy('order_number', 'ASC')->get()->toArray();
    }

    public function getCategories(): array
    {
        return Category::orderBy('order_number', 'ASC')->get()->toArray();
    }
}
