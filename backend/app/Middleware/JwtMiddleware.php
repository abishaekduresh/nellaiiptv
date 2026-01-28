<?php

namespace App\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Firebase\JWT\JWT;
use App\Helpers\ResponseFormatter;
use Slim\Psr7\Response as SlimResponse;

class JwtMiddleware implements MiddlewareInterface
{
    public function process(Request $request, RequestHandler $handler): Response
    {
        $authHeader = $request->getHeaderLine('Authorization');
        $arr = explode(' ', $authHeader);
        $token = $arr[1] ?? '';

        if (!$token) {
            return ResponseFormatter::error(new SlimResponse(), 'Unauthorized: No token provided', 401);
        }

        try {
            $decoded = JWT::decode($token, $_ENV['JWT_SECRET'], ['HS256']);
            
            // Session Validation (JTI check)
            if (isset($decoded->jti)) {
                $session = \App\Models\CustomerSession::where('session_token', $decoded->jti)->first();
                if (!$session) {
                    return ResponseFormatter::error(new SlimResponse(), 'Unauthorized: Session expired or invalid', 401);
                }
                
                // Update last active timestamp (optional optimization: only update if > 5 mins old)
                $session->last_active = date('Y-m-d H:i:s');
                $session->save();
            }

            // Security: Global Device Limit Enforcement Guard
            // This ensures that if a plan limit is changed or multiple logins slip through, 
            // the user is blocked until they manage their devices.
            $isRestrictedToken = (isset($decoded->scopes) && in_array('manage_devices', $decoded->scopes));
            
            if (!$isRestrictedToken) {
                $customer = \App\Models\Customer::with('plan')->where('uuid', $decoded->sub)->first();
                if ($customer) {
                    $path = $request->getUri()->getPath();
                    $managementPaths = [
                        '/api/customers/profile', 
                        '/api/customers/sessions', 
                        '/api/customers/logout',
                        '/api/customers/refresh-token',
                        '/api/payments'
                    ];
                    $isManagementPath = false;
                    foreach ($managementPaths as $mPath) {
                        if (strpos($path, $mPath) !== false) {
                            $isManagementPath = true;
                            break;
                        }
                    }

                    $isOpenAccessVal = \App\Models\Setting::get('is_open_access', 0);
                    $isOpenAccess = ($isOpenAccessVal == 1 || $isOpenAccessVal === true || $isOpenAccessVal === '1');

                    // POLICY: Redirect to Plans if plan is missing AND NOT accessing management/profile
                    // EXCEPTION: Resellers don't need a subscription plan
                    // EXCEPTION: Open Access mode bypasses plan requirement
                    $isReseller = ($customer->role === 'reseller');
                    if (!$customer->plan && !$isManagementPath && !$isReseller && !$isOpenAccess) {
                         return ResponseFormatter::error(new SlimResponse(), 'An active subscription plan is required to access this feature.', 403, ['error' => 'subscription_required']);
                    }

                    // Enforce Device Limit
                    // Resellers: Always 1 device
                    // Customers with plan: Use plan's device_limit
                    // Customers without plan: Default to 1
                    // EXCEPTION: Open Access mode bypasses device limits
                    if ($isOpenAccess) {
                        $deviceLimit = 999; // Effectively unlimited in Open Access
                    } elseif ($isReseller) {
                        $deviceLimit = 1;
                    } else {
                        $deviceLimit = $customer->plan ? $customer->plan->device_limit : 1;
                    }
                    
                    $activeSessionsCount = \App\Models\CustomerSession::where('customer_id', $customer->id)->count();
                    
                    if ($activeSessionsCount > $deviceLimit) {
                        // Only allow logout or session retrieval when over limit
                        $allowedPaths = ['/api/customers/sessions', '/api/customers/logout', '/api/payments'];
                        $isAllowed = false;
                        foreach ($allowedPaths as $allowed) {
                            if (strpos($path, $allowed) !== false) {
                                $isAllowed = true;
                                break;
                            }
                        }
                        
                        if (!$isAllowed) {
                            return ResponseFormatter::error(new SlimResponse(), 'Device limit reached. Please manage your devices.', 403, ['error' => 'device_limit_reached']);
                        }
                    }
                }
            } else {
                // Restricted Scope: Handle tokens that only permit device management (revocation Flow)
                $path = $request->getUri()->getPath();
                $allowedPaths = [
                    '/api/customers/sessions',
                    '/api/customers/logout'
                ];
                
                $isAllowed = false;
                foreach ($allowedPaths as $allowed) {
                    if (strpos($path, $allowed) !== false) {
                        $isAllowed = true;
                        break;
                    }
                }

                if (!$isAllowed) {
                    return ResponseFormatter::error(new SlimResponse(), 'Forbidden: Restricted access. Please manage devices.', 403, ['error' => 'device_limit_reached']);
                }
            }

            $request = $request->withAttribute('user', $decoded);
        } catch (\Exception $e) {
            return ResponseFormatter::error(new SlimResponse(), 'Unauthorized: Invalid token', 401);
        }

        return $handler->handle($request);
    }
}
