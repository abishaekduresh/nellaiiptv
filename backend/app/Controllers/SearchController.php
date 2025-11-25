<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Services\Admin\ChannelService as AdminChannelService;
use App\Helpers\ResponseFormatter;

class SearchController
{
    private $channelService;

    public function __construct(AdminChannelService $channelService)
    {
        $this->channelService = $channelService;
    }

    public function searchChannels(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();
        $results = $this->channelService->search($params);
        return ResponseFormatter::success($response, $results, 'Search results retrieved successfully');
    }
}
