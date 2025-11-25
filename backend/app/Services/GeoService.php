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
        return Language::all()->toArray();
    }

    public function getCategories(): array
    {
        return Category::all()->toArray();
    }
}
