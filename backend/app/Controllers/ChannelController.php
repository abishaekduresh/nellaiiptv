<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Services\ChannelService;
use App\Helpers\ResponseFormatter;
use App\Helpers\Validator;
use Exception;

class ChannelController
{
    private $channelService;

    public function __construct(ChannelService $channelService)
    {
        $this->channelService = $channelService;
    }

    public function index(Request $request, Response $response): Response
    {
        $filters = $request->getQueryParams();
        
        // Platform checked by middleware
        $platform = $request->getHeaderLine('X-Client-Platform');
        $filters['platform'] = strtolower($platform);

        $channels = $this->channelService->getAll($filters);
        return ResponseFormatter::success($response, $channels, 'Channels retrieved successfully');
    }

    public function getFeatured(Request $request, Response $response): Response
    {
        $limit = $request->getQueryParams()['limit'] ?? 20;
        // Platform enforced by middleware
        $platform = $request->getHeaderLine('X-Client-Platform');
        $channels = $this->channelService->getFeatured((int)$limit, strtolower($platform));
        return ResponseFormatter::success($response, $channels, 'Featured channels retrieved successfully');
    }



    public function show(Request $request, Response $response, string $uuid): Response
    {
        try {
            error_log("ChannelController::show called with UUID: " . $uuid);
            $channel = $this->channelService->getOne($uuid);
            return ResponseFormatter::success($response, $channel, 'Channel details retrieved successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 404);
        }
    }

    public function rate(Request $request, Response $response, string $uuid): Response
    {
        $user = $request->getAttribute('user');
        $data = $request->getParsedBody() ?? [];
        
        // Assuming user object has 'id' or we need to fetch it. 
        // JWT payload usually has uuid. We need to get ID from DB or store ID in JWT.
        // For now, let's assume we fetch user by UUID in service or here.
        // Actually, AuthService puts uuid in token. We need to resolve ID.
        // Ideally, we should have a helper or middleware that resolves User model.
        // But for speed, I'll fetch user ID here or in service.
        // Let's pass UUID to service and let it resolve.
        // Wait, ChannelService::rate expects customerId (int).
        // I should update ChannelService to accept UUID or resolve it here.
        // I'll resolve it here for now using a helper or direct DB call.
        
        $customer = \App\Models\Customer::where('uuid', $user->sub)->first();
        if (!$customer) return ResponseFormatter::error($response, 'User not found', 401);

        $errors = Validator::validate($data, [
            'required' => [['rating']],
            'integer' => [['rating']],
            'min' => [['rating', 1]],
            'max' => [['rating', 5]]
        ]);

        if ($errors) return ResponseFormatter::error($response, 'Validation failed', 400, $errors);

        try {
            $this->channelService->rate($uuid, $data['rating'], $customer->id);
            return ResponseFormatter::success($response, null, 'Rating submitted successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 400);
        }
    }

    public function getRatings(Request $request, Response $response, string $uuid): Response
    {
        try {
            $ratings = $this->channelService->getRatings($uuid);
            return ResponseFormatter::success($response, $ratings, 'Channel ratings retrieved successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 404);
        }
    }

    public function addComment(Request $request, Response $response, string $uuid): Response
    {
        $user = $request->getAttribute('user');
        $data = $request->getParsedBody() ?? [];
        
        $customer = \App\Models\Customer::where('uuid', $user->sub)->first();
        if (!$customer) return ResponseFormatter::error($response, 'User not found', 401);

        $errors = Validator::validate($data, [
            'required' => [['comment']],
            'lengthMin' => [['comment', 1]]
        ]);

        if ($errors) return ResponseFormatter::error($response, 'Validation failed', 400, $errors);

        try {
            $comment = $this->channelService->addComment($uuid, $data['comment'], $customer->id);
            return ResponseFormatter::success($response, $comment, 'Comment added successfully', 201);
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 400);
        }
    }

    public function getComments(Request $request, Response $response, string $uuid): Response
    {
        try {
            $comments = $this->channelService->getComments($uuid);
            return ResponseFormatter::success($response, $comments, 'Channel comments retrieved successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 404);
        }
    }

    public function getRelated(Request $request, Response $response, string $uuid): Response
    {
        try {
            // Platform enforced by middleware
            $platform = $request->getHeaderLine('X-Client-Platform');
            $channels = $this->channelService->getRelated($uuid, strtolower($platform));
            return ResponseFormatter::success($response, $channels, 'Related channels retrieved successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 404);
        }
    }

    public function getNew(Request $request, Response $response): Response
    {
        // Platform enforced by middleware
        $platform = $request->getHeaderLine('X-Client-Platform');
        $channels = $this->channelService->getNew(strtolower($platform));
        return ResponseFormatter::success($response, $channels, 'New channels retrieved successfully');
    }

    public function heartbeat(Request $request, Response $response, string $uuid): Response
    {
        $data = $request->getParsedBody() ?? [];
        
        $errors = Validator::validate($data, [
            'required' => [['device_uuid']]
        ]);

        if ($errors) return ResponseFormatter::error($response, 'Validation failed', 400, $errors);

        try {
            $count = $this->channelService->heartbeat($uuid, $data['device_uuid']);
            return ResponseFormatter::success($response, ['live_viewers' => $count], 'Heartbeat received');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 400);
        }
    }

    public function incrementView(Request $request, Response $response, string $uuid): Response
    {
        try {
            $ip = $request->getServerParams()['REMOTE_ADDR'] ?? '0.0.0.0';
            // Handle proxy headers if necessary (though simple REMOTE_ADDR is often safer unless trusted proxy)
            if (isset($request->getServerParams()['HTTP_X_FORWARDED_FOR'])) {
                 $ip = explode(',', $request->getServerParams()['HTTP_X_FORWARDED_FOR'])[0];
            }
            
            $this->channelService->incrementView($uuid, trim($ip));
            return ResponseFormatter::success($response, null, 'View count incremented');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 400);
        }
    }

    public function report(Request $request, Response $response, string $uuid): Response
    {
        $data = $request->getParsedBody() ?? [];
        
        // Get customer if authenticated
        $user = $request->getAttribute('user');
        $customerId = null;
        
        if ($user && isset($user->sub)) {
            $customer = \App\Models\Customer::where('uuid', $user->sub)->first();
            if ($customer) {
                $customerId = $customer->id;
            }
        }

        $errors = Validator::validate($data, [
            'required' => [['issue_type']],
            'lengthMin' => [['issue_type', 1]]
        ]);

        if ($errors) return ResponseFormatter::error($response, 'Validation failed', 400, $errors);

        try {
            $description = $data['description'] ?? null;
            $report = $this->channelService->createReport($uuid, $data['issue_type'], $description, $customerId);
            return ResponseFormatter::success($response, $report, 'Report submitted successfully', 201);
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 400);
        }
    }
}
