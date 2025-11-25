<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Services\GeoService;
use App\Helpers\ResponseFormatter;

class GeoController
{
    private $geoService;

    public function __construct(GeoService $geoService)
    {
        $this->geoService = $geoService;
    }

    public function getStates(Request $request, Response $response): Response
    {
        $states = $this->geoService->getStates();
        return ResponseFormatter::success($response, $states, 'States retrieved successfully');
    }

    public function getDistricts(Request $request, Response $response): Response
    {
        $districts = $this->geoService->getDistricts();
        return ResponseFormatter::success($response, $districts, 'Districts retrieved successfully');
    }

    public function getLanguages(Request $request, Response $response): Response
    {
        $languages = $this->geoService->getLanguages();
        return ResponseFormatter::success($response, $languages, 'Languages retrieved successfully');
    }

    public function getCategories(Request $request, Response $response): Response
    {
        $categories = $this->geoService->getCategories();
        return ResponseFormatter::success($response, $categories, 'Categories retrieved successfully');
    }
}
