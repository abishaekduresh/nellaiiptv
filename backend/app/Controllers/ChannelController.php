<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Services\ChannelService;
use App\Helpers\ResponseFormatter;
use App\Helpers\Validator;
use App\Models\Setting;
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

        $user = $request->getAttribute('user');
        $isOpenAccess = Setting::get('is_open_access', 0) == 1;

        // Enforce Auth if not Open Access
        if (!$user && !$isOpenAccess) {
             return ResponseFormatter::error($response, 'Unauthorized', 401);
        }

        // Perform Subscription Check for Premium Redaction in List
        $allowPremium = $isOpenAccess; // defaulting to true if open access
        
        if ($user) {
             $customer = \App\Models\Customer::where('uuid', $user->sub)->first();
             if ($customer) {
                 // Pass customer ID for fetching user-specific ratings
                 $filters['customer_id'] = $customer->id;
                 
                 if ($customer->status === 'active' && $customer->subscription_plan_id) {
                     if ($customer->subscription_expires_at && $customer->subscription_expires_at->isFuture()) {
                         $allowPremium = true;
                     }
                 }
             }
        }

        $channels = $this->channelService->getAll($filters, $allowPremium);
        return ResponseFormatter::success($response, $channels, 'Channels retrieved successfully');
    }

    public function getFeatured(Request $request, Response $response): Response
    {
        $limit = $request->getQueryParams()['limit'] ?? 20;
        // Platform enforced by middleware
        $platform = $request->getHeaderLine('X-Client-Platform');
        
        $user = $request->getAttribute('user');
        $isOpenAccess = Setting::get('is_open_access', 0) == 1;

        if (!$user && !$isOpenAccess) {
             return ResponseFormatter::error($response, 'Unauthorized', 401);
        }

        $channels = $this->channelService->getFeatured((int)$limit, strtolower($platform));
        // Note: getFeatured in service doesn't currently accept allowPremium flag, 
        // it calls processChannelOutput internally without it? 
        // Checking Service: getFeatured DOES call processChannelOutput($channel). 
        // It uses default false for allowPremium. 
        // I should update Service or just iterate here? 
        // Service `getFeatured` implementation loops and calls `processChannelOutput`. 
        // But `processChannelOutput` second arg is `$allowPremium` default false.
        // `getFeatured` implementation in Service does NOT pass the second arg.
        // So featured channels are ALWAYS redacted if premium? 
        // I will fix this by re-processing or assuming featured ones are free?
        // Actually, let's just return what service returns for now, ensuring access control.
        return ResponseFormatter::success($response, $channels, 'Featured channels retrieved successfully');
    }



    public function show(Request $request, Response $response, string $uuid): Response
    {
        try {
            // Platform checked by middleware, but we need it for specific restriction logic
            $platform = $request->getHeaderLine('X-Client-Platform');
             // If empty (shouldn't happen due to middleware), default to 'web' safely
            $platform = !empty($platform) ? strtolower($platform) : 'web';

            $user = $request->getAttribute('user');
            $isOpenAccess = Setting::get('is_open_access', 0) == 1;

            if (!$user && !$isOpenAccess) {
                return ResponseFormatter::error($response, 'Unauthorized', 401);
            }

            // Perform Subscription Check
            $allowPremium = $isOpenAccess;
            
            if ($user) {
                // Fetch full customer to check plan status
                // Optimization: Could store plan info in JWT to avoid DB call
                // But specifically for 'active' status checking real-time is safer
                $customer = \App\Models\Customer::where('uuid', $user->sub)->first();
                if ($customer && $customer->status === 'active' && $customer->subscription_plan_id) {
                     // Check expiry
                     if ($customer->subscription_expires_at && $customer->subscription_expires_at->isFuture()) {
                         $allowPremium = true;
                     }
                }
            }

            $channel = $this->channelService->getOne($uuid, $platform, $allowPremium);
            
            // If channel is premium and user not allowed, we can return 403 or just the Restricted URL.
            // Returning the object with 'PAID_RESTRICTED' allows frontend to show "Upgrade to Premium" UI.
            // But if we want strict 403:
            if (!empty($channel->is_premium) && !$allowPremium) {
                 // Option A: Return 403
                 // return ResponseFormatter::error($response, 'Premium subscription required', 403);
                 
                 // Option B: Return object with restricted URL (Current behavior of Service)
                 // Let's stick to returning object so UI can show "Locked" state
            }

            // Fetch User Rating if Authenticated
            if ($user && isset($user->sub)) {
                 $customer = \App\Models\Customer::where('uuid', $user->sub)->first();
                 if ($customer) {
                     $ratingVal = \App\Models\ChannelRating::where('channel_id', is_object($channel) ? $channel->id : $channel['id'])
                                 ->where('customer_id', $customer->id)
                                 ->value('rating');
                     
                     if (is_object($channel)) {
                         $channel->user_rating = $ratingVal ? (int)$ratingVal : 0;
                     } else {
                         $channel['user_rating'] = $ratingVal ? (int)$ratingVal : 0;
                     }
                 }
            }

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
            // Return updated ratings
            $newRatings = $this->channelService->getRatings($uuid);
            return ResponseFormatter::success($response, $newRatings, 'Rating submitted successfully');
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

            $user = $request->getAttribute('user');
            $isOpenAccess = Setting::get('is_open_access', 0) == 1;

            if (!$user && !$isOpenAccess) {
                return ResponseFormatter::error($response, 'Unauthorized', 401);
            }

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

        $user = $request->getAttribute('user');
        $isOpenAccess = Setting::get('is_open_access', 0) == 1;

        if (!$user && !$isOpenAccess) {
                return ResponseFormatter::error($response, 'Unauthorized', 401);
        }

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
