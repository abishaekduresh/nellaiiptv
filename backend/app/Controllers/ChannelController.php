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
        $isOpenAccessVal = Setting::get('is_open_access', 0);
        $isOpenAccess = ($isOpenAccessVal == 1 || $isOpenAccessVal === true || $isOpenAccessVal === '1');
        
        // Enforce Auth if not Open Access - REMOVED for Public API
        // if (!$user && !$isOpenAccess) {
        //      return ResponseFormatter::error($response, 'Unauthorized', 401);
        // }

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
        $platform = $request->getHeaderLine('X-Client-Platform');
        
        $user = $request->getAttribute('user');
        $isOpenAccessVal = Setting::get('is_open_access', 0);
        $isOpenAccess = ($isOpenAccessVal == 1 || $isOpenAccessVal === true || $isOpenAccessVal === '1');

        if (!$user && !$isOpenAccess) {
             // return ResponseFormatter::error($response, 'Unauthorized', 401);
        }

        $allowPremium = $isOpenAccess;
        if ($user) {
             $customer = \App\Models\Customer::where('uuid', $user->sub)->first();
             if ($customer && $customer->status === 'active' && $customer->subscription_plan_id) {
                 if ($customer->subscription_expires_at && $customer->subscription_expires_at->isFuture()) {
                     $allowPremium = true;
                 }
             }
        }

        $channels = $this->channelService->getFeatured((int)$limit, strtolower($platform), $allowPremium);
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
            $isOpenAccessVal = Setting::get('is_open_access', 0);
            $isOpenAccess = ($isOpenAccessVal == 1 || $isOpenAccessVal === true || $isOpenAccessVal === '1');

            // Check if Channel is Public Preview
            // We need to fetch the channel first to check this flag.
            
            // Optimization: Fetch just the is_preview_public flag? 
            // Or just fetch the channel and if it fails due to premium, we handle it?
            
            // Let's try to fetch it first. 
            // We pass false for allowPremium initially to see if we can get basic info.
            // But ChannelService::getOne might return restricted object.
            
            $allowPremium = $isOpenAccess;
            $channel = $this->channelService->getOne($uuid, $platform, $allowPremium);
            
            // Check if preview is public
            $isPreviewPublic = false;
            if (is_object($channel)) {
                $isPreviewPublic = $channel->is_preview_public ?? false;
            } elseif (is_array($channel)) {
                $isPreviewPublic = $channel['is_preview_public'] ?? false;
            }

            // Check if User is Admin
            $isAdmin = false;
            if ($user && isset($user->type) && $user->type === 'admin') {
                $isAdmin = true;
            }

            // Access Rules:
            // 1. If Admin -> ALLOW
            // 2. If Public Preview -> ALLOW (regardless of Open Access setting, unless Open Access overrides "private" which it shouldn't)
            // 3. If User is Customer (not Admin) ->
            //    - If Open Access ON -> ALLOW? User said "allow only when Preview Public is true".
            //    - PROBABLE MEANING: Open Access setting shouldn't force private channels to be open.
            //    - So if isPreviewPublic is FALSE, even if Open Access is ON, we might want to block?
            //    - Or does Open Access mean "Members don't need subscription"?
            //    - Re-reading: "Open Access is enabled? allow only when Preview Public is true" 
            //      -> This implies that for "Preview" pages, Open Access Global Setting is IRRELEVANT if the channel is private.
            //      -> Public Preview is the ONLY key for non-admins.
            
            if ($isAdmin) {
                // Admin always allowed
                $allowPremium = true; // Admins see everything
            } elseif ($isPreviewPublic) {
                 // Public Preview allowed
                 $allowPremium = true; 
            } elseif ($user) {
                 // Logged in users (Customers/Resellers) allowed to see details
                 // Premium content redaction handles the rest
            } else {
                 // Guest AND Not Public Preview -> BLOCK
                 return ResponseFormatter::error($response, 'Unauthorized', 401);
            }

            // If Public Preview is enabled, we might want to ensure they get the stream URL even if it's premium?
            // Usually "Public Preview" implies they can watch it.
            // If the channel is Premium AND Public Preview, we should probably allow it.
            if ($isPreviewPublic) {
                $allowPremium = true;
                // Re-fetch if we need to unlock premium content that might have been redacted
                // But ChannelService::getOne handles redaction based on $allowPremium passed to it.
                // We passed $allowPremium (which was false/true based on auth) initially.
                // If we now decide it's allowed, we might need to re-fetch or manually un-redact if service supports it?
                // Simpler: Fetch it again if we decided to allow it and didn't before.
                
                $initialAllowPremium = $isOpenAccess;
                 if ($user) {
                    $customer = \App\Models\Customer::where('uuid', $user->sub)->first();
                    if ($customer && $customer->status === 'active' && $customer->subscription_plan_id) {
                         if ($customer->subscription_expires_at && $customer->subscription_expires_at->isFuture()) {
                             $initialAllowPremium = true;
                         }
                    }
                }
                
                if (!$initialAllowPremium) {
                     $channel = $this->channelService->getOne($uuid, $platform, true);
                }
            }
            
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
            $platform = $request->getHeaderLine('X-Client-Platform');
            $user = $request->getAttribute('user');
            $isOpenAccess = Setting::get('is_open_access', 0) == 1;

            if (!$user && !$isOpenAccess) {
                // return ResponseFormatter::error($response, 'Unauthorized', 401);
            }

            $allowPremium = $isOpenAccess;
            if ($user) {
                 $customer = \App\Models\Customer::where('uuid', $user->sub)->first();
                 if ($customer && $customer->status === 'active' && $customer->subscription_plan_id) {
                     if ($customer->subscription_expires_at && $customer->subscription_expires_at->isFuture()) {
                         $allowPremium = true;
                     }
                 }
            }

            $channels = $this->channelService->getRelated($uuid, strtolower($platform), $allowPremium);
            return ResponseFormatter::success($response, $channels, 'Related channels retrieved successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 404);
        }
    }

    public function getNew(Request $request, Response $response): Response
    {
        $platform = $request->getHeaderLine('X-Client-Platform');
        $user = $request->getAttribute('user');
        $isOpenAccess = Setting::get('is_open_access', 0) == 1;

        if (!$user && !$isOpenAccess) {
                // return ResponseFormatter::error($response, 'Unauthorized', 401);
        }

        $allowPremium = $isOpenAccess;
        if ($user) {
             $customer = \App\Models\Customer::where('uuid', $user->sub)->first();
             if ($customer && $customer->status === 'active' && $customer->subscription_plan_id) {
                 if ($customer->subscription_expires_at && $customer->subscription_expires_at->isFuture()) {
                     $allowPremium = true;
                 }
             }
        }

        $channels = $this->channelService->getNew(strtolower($platform), $allowPremium);
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
