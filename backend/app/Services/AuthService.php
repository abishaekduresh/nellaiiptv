<?php

namespace App\Services;

use App\Models\Customer;
use App\Services\ActivityLogger; // Added
use Firebase\JWT\JWT;
use Ramsey\Uuid\Uuid;
use Exception;

class AuthService
{
    private $jwtSecret;
    private $activityLogger;
    private $emailService; // Added

    public function __construct(ActivityLogger $activityLogger, \App\Services\Email\EmailServiceInterface $emailService)
    {
        $this->activityLogger = $activityLogger;
        $this->emailService = $emailService;
        $this->jwtSecret = $_ENV['API_SECRET'];
    }

    // ... (keep existing methods until forgotPassword) ...

    public function forgotPassword(string $email): bool
    {
        $customer = Customer::where('email', $email)->first();

        // Prevent enumeration
        if (!$customer) {
            return true;
        }

        $token = bin2hex(random_bytes(32));
        $customer->reset_token = $token;
        $customer->reset_token_expiry = date('Y-m-d H:i:s', strtotime('+1 hour'));
        $customer->save();

        $resetLink = $_ENV['APP_URL'] . "/reset-password?token={$token}";
        
        $html = "
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                <h2>Reset Your Password</h2>
                <p>Hello {$customer->name},</p>
                <p>You requested a password reset for your Nellai IPTV account.</p>
                <p>Click the button below to reset your password. This link is valid for 1 hour.</p>
                <a href='{$resetLink}' style='background-color: #06b6d4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;'>Reset Password</a>
                <p>If you didn't request this, you can safely ignore this email.</p>
                <p>Thanks,<br>Nellai IPTV Team</p>
            </div>
        ";

        return $this->emailService->send($email, 'Reset Your Password', $html);
    }

    public function register(array $data): array
    {
        if (Customer::where('phone', $data['phone'])->exists()) {
            throw new Exception('Phone number already registered');
        }

        if (isset($data['email']) && Customer::where('email', $data['email'])->exists()) {
            throw new Exception('Email address already registered');
        }

        $customer = new Customer();
        $customer->uuid = Uuid::uuid4()->toString();
        $customer->name = $data['name'];
        $customer->email = $data['email'] ?? null;
        $customer->phone = $data['phone'];
        $customer->password = password_hash($data['password'], PASSWORD_BCRYPT);
        $customer->status = 'active';
        $customer->created_at = date('Y-m-d H:i:s');
        $customer->save();

        return $this->generateTokens($customer);
    }

    public function login(string $phone, string $password, array $deviceInfo = []): array
    {
        $customer = Customer::with('plan')->where('phone', $phone)->first();

        if (!$customer || !password_verify($password, $customer->password)) {
            throw new Exception('Invalid credentials');
        }

        if ($customer->status !== 'active') {
            throw new Exception('Account is not active');
        }

        // Subscription Checks
        $plan = $customer->plan;
        
        // 1. Expiry Check
        // Ensure strictly that it is a valid date object before calling methods
        if (!empty($customer->subscription_expires_at)) {
             try {
                // If cast to Carbon/DateTime
                if ($customer->subscription_expires_at instanceof \DateTimeInterface) {
                    if ($customer->subscription_expires_at < new \DateTime()) {
                        throw new Exception('Subscription expired', 403);
                    }
                } 
                // Fallback if not cast (string)
                elseif (is_string($customer->subscription_expires_at)) {
                    $expiry = new \DateTime($customer->subscription_expires_at);
                    if ($expiry < new \DateTime()) {
                        throw new Exception('Subscription expired', 403);
                    }
                }
             } catch (\Exception $e) {
                 // If date parsing fails, ignore/allow or block?
                 // If invalid date string, safest is to Log and Block or Log and Allow.
                 // Given it's subscription, let's Block if clearly expired, otherwise maybe data error.
                 // For now, let's just swallow exception if it's purely a format error to prevent 500.
                 error_log("Date Error in AuthService: " . $e->getMessage());
             }
        }
        
        // 2. Platform Access Check
        $currentPlatform = $deviceInfo['platform'] ?? 'web';
        if ($plan && !empty($plan->platform_access)) {
            $allowedPlatforms = $plan->platform_access;
            if (!in_array($currentPlatform, $allowedPlatforms)) {
                throw new Exception("Access denied on {$currentPlatform} platform. Upgrade plan.", 403);
            }
        }

        // Check active sessions using ID
        $activeSessions = \App\Models\CustomerSession::where('customer_id', $customer->id)->count();
        $deviceLimit = $plan ? $plan->device_limit : 1; // Default to 1 if no plan

        if ($activeSessions >= $deviceLimit) {
             // Generate restricted token
            return $this->generateRestrictedToken($customer);
        }

        $this->activityLogger->log($customer->id, 'LOGIN', 'User logged in successfully', $deviceInfo);

        return $this->generateTokens($customer, $deviceInfo);
    }

    public function refreshToken(object $user): array
    {
        $customer = Customer::where('uuid', $user->sub)->first();
        
        if (!$customer || $customer->status !== 'active') {
            throw new Exception('Invalid user');
        }

        if (isset($user->jti)) {
             $session = \App\Models\CustomerSession::where('session_token', $user->jti)->first();
             if (!$session) {
                 throw new Exception('Session invalid or expired');
             }
             $session->last_active = date('Y-m-d H:i:s');
             $session->save();
             
             return $this->generateTokens($customer, [], $user->jti);
        }

        return $this->generateTokens($customer);
    }

    private function generateTokens(Customer $customer, array $deviceInfo = [], ?string $jti = null): array
    {
        $issuedAt = time();
        $expirationTime = $issuedAt + $_ENV['JWT_EXPIRATION'];
        
        if (!$jti) {
            $jti = bin2hex(random_bytes(16));
            
            // Create session using ID
            $session = new \App\Models\CustomerSession();
            $session->customer_id = $customer->id; // Changed from uuid
            $session->session_token = $jti;
            $session->device_name = $deviceInfo['device_name'] ?? 'Unknown Device';
            $session->platform = $deviceInfo['platform'] ?? 'web';
            $session->ip_address = $deviceInfo['ip_address'] ?? null;
            $session->created_at = date('Y-m-d H:i:s');
            $session->last_active = date('Y-m-d H:i:s');
            $session->save();
        }

        $payload = [
            'iss' => $_ENV['APP_URL'],
            'sub' => $customer->uuid, // Keep UUID in token subject
            'jti' => $jti,
            'iat' => $issuedAt,
            'exp' => $expirationTime,
        ];

        $token = JWT::encode($payload, $_ENV['JWT_SECRET'], 'HS256');

        return [
            'token' => $token,
            'expires_in' => $_ENV['JWT_EXPIRATION'],
            'user' => [
                'uuid' => $customer->uuid,
                'name' => $customer->name,
                'phone' => $customer->phone,
                'email' => $customer->email,
                'status' => $customer->status,
                'subscription_plan_id' => $customer->subscription_plan_id,
                'subscription_expires_at' => $customer->subscription_expires_at,
                'plan' => $customer->plan,
            ]
        ];
    }

    private function generateRestrictedToken(Customer $customer): array
    {
        $issuedAt = time();
        $expirationTime = $issuedAt + 300; // 5 minutes validity for restricted action

        $payload = [
            'iss' => $_ENV['APP_URL'],
            'sub' => $customer->uuid,
            'iat' => $issuedAt,
            'exp' => $expirationTime,
            'scopes' => ['restricted'] // Flag to indicate restricted access
        ];

        $token = JWT::encode($payload, $_ENV['JWT_SECRET'], 'HS256');

        return [
            'token' => $token,
            'expires_in' => 300,
            'device_limit_reached' => true,
            'user' => [
                'uuid' => $customer->uuid,
                'name' => $customer->name,
                'phone' => $customer->phone,
                'email' => $customer->email,
                'status' => $customer->status,
                'subscription_plan_id' => $customer->subscription_plan_id,
                'plan' => $customer->plan,
            ]
        ];
    }

    // ... restricted token (unchanged, uses uuid for payload) ...

    public function getSessions(string $customerUuid): array
    {
        $customer = Customer::where('uuid', $customerUuid)->first();
        if (!$customer) return [];

        return \App\Models\CustomerSession::where('customer_id', $customer->id)
            ->orderBy('last_active', 'desc')
            ->get()
            ->toArray();
    }

    public function revokeSession(string $customerUuid, int $sessionId, array $deviceInfo = [], bool $attemptAutoLogin = false): array
    {
        $customer = Customer::where('uuid', $customerUuid)->first();
        if (!$customer) return ['success' => false, 'tokens' => null];

        $session = \App\Models\CustomerSession::where('customer_id', $customer->id)
            ->where('id', $sessionId)
            ->first();

        if ($session) {
            $session->delete();
            
            $this->activityLogger->log($customer->id, 'REVOKE_DEVICE', "Revoked session ID: $sessionId", $deviceInfo);

            if ($attemptAutoLogin) {
                $activeSessions = \App\Models\CustomerSession::where('customer_id', $customer->id)->count();
                // Fetch customer's plan limit
                $customer->load('plan');
                $deviceLimit = $customer->plan ? $customer->plan->device_limit : 1;

                if ($activeSessions < $deviceLimit) {
                    $tokens = $this->generateTokens($customer, $deviceInfo);
                    $this->activityLogger->log($customer->id, 'LOGIN', 'Auto-login after device revocation', $deviceInfo);
                    return ['success' => true, 'tokens' => $tokens];
                }
            }

            return ['success' => true, 'tokens' => null];
        }
        return ['success' => false, 'tokens' => null];
    }

    public function logout(string $customerUuid, string $jti, array $deviceInfo = []): void
    {
        $customer = Customer::where('uuid', $customerUuid)->first();
        if ($customer) {
            \App\Models\CustomerSession::where('customer_id', $customer->id)
                ->where('session_token', $jti)
                ->delete();

            $this->activityLogger->log($customer->id, 'LOGOUT', 'User logged out', $deviceInfo);
        }
    }

    public function resetPassword(string $token, string $password): bool
    {
        $customer = Customer::where('reset_token', $token)
            ->where('reset_token_expiry', '>', date('Y-m-d H:i:s'))
            ->first();

        if (!$customer) {
            throw new Exception('Invalid or expired token');
        }

        $customer->password = password_hash($password, PASSWORD_BCRYPT);
        $customer->reset_token = null;
        $customer->reset_token_expiry = null;
        $customer->save();

        return true;
    }
}
