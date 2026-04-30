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
        $this->jwtSecret = $_ENV['JWT_SECRET'] ?? '';
    }

    // ... (keep existing methods until forgotPassword) ...

    public function forgotPassword(string $email, bool $skipEmail = false)
    {
        $customer = Customer::where('email', $email)->first();

        if (!$customer) {
            throw new Exception('No account found with this email address.');
        }
        
        if ($customer->status !== 'active') {
            throw new Exception('This account is not active. Please contact support.');
        }

        $token = bin2hex(random_bytes(32));
        $customer->reset_token = $token;
        $customer->reset_token_expiry = date('Y-m-d H:i:s', strtotime('+1 hour'));
        $customer->save();

        if ($skipEmail) {
            return $token;
        }

        $frontendUrl = rtrim($_ENV['FRONTEND_URL'] ?? 'http://localhost:3000', '/');
        $resetLink = $frontendUrl . "/reset-password?token={$token}";
        $year = date('Y');
        
        $html = "<!DOCTYPE html>
<html lang=\"en\">
<head>
  <meta charset=\"UTF-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />
  <title>Reset Your Password</title>
</head>
<body style=\"margin:0;padding:0;background-color:#0f172a;font-family:'Segoe UI',Arial,sans-serif;\">
  <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color:#0f172a;padding:40px 20px;\">
    <tr>
      <td align=\"center\">
        <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:520px;background-color:#1e293b;border-radius:12px;border:1px solid #334155;overflow:hidden;\">
          <tr>
            <td style=\"background-color:#0891b2;padding:28px 32px;text-align:center;\">
              <p style=\"margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.5px;\">Nellai IPTV</p>
            </td>
          </tr>
          <tr>
            <td style=\"padding:36px 32px;\">
              <h1 style=\"margin:0 0 12px;font-size:22px;font-weight:700;color:#f1f5f9;\">Reset Your Password</h1>
              <p style=\"margin:0 0 24px;font-size:15px;color:#94a3b8;line-height:1.6;\">
                We received a request to reset the password for your account. Click the button below to set a new password.
                This link is valid for <strong style=\"color:#e2e8f0;\">1 hour</strong>.
              </p>
              <table cellpadding=\"0\" cellspacing=\"0\" style=\"margin:0 0 28px;\">
                <tr>
                  <td style=\"background-color:#0891b2;border-radius:8px;\">
                    <a href=\"{$resetLink}\" style=\"display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;\">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style=\"margin:0 0 8px;font-size:13px;color:#64748b;\">If the button doesn't work, copy and paste this link:</p>
              <p style=\"margin:0 0 28px;font-size:12px;word-break:break-all;\">
                <a href=\"{$resetLink}\" style=\"color:#0891b2;\">{$resetLink}</a>
              </p>
              <hr style=\"border:none;border-top:1px solid #334155;margin:0 0 24px;\" />
              <p style=\"margin:0;font-size:13px;color:#64748b;line-height:1.6;\">
                If you did not request a password reset, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style=\"padding:16px 32px;background-color:#0f172a;text-align:center;\">
              <p style=\"margin:0;font-size:12px;color:#475569;\">&copy; {$year} Nellai IPTV. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>";

        $emailSent = $this->emailService->send($email, 'Reset your password — Nellai IPTV', $html);

        if (!$emailSent) {
            throw new Exception('Failed to send reset email. Please try again later.');
        }

        return true;
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
        $customer->role = 'customer'; // Default role
        $customer->created_by_type = 'self'; // Self-registration
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

        // Subscription Checks (skip for resellers and in Open Access mode)
        $isOpenAccessVal = \App\Models\Setting::get('is_open_access', 0);
        $isOpenAccess = ($isOpenAccessVal == 1 || $isOpenAccessVal === true || $isOpenAccessVal === '1');

        $isReseller = ($customer->role === 'reseller');
        if (!$isReseller && !$isOpenAccess) {
            $plan = $customer->plan;
            
            // 1. Expiry Check
            if ($plan && !empty($customer->subscription_expires_at)) {
                 try {
                    if ($customer->subscription_expires_at instanceof \DateTimeInterface) {
                        if ($customer->subscription_expires_at < new \DateTime()) {
                            throw new Exception('Subscription expired', 403);
                        }
                    } elseif (is_string($customer->subscription_expires_at)) {
                        $expiry = new \DateTime($customer->subscription_expires_at);
                        if ($expiry < new \DateTime()) {
                            throw new Exception('Subscription expired', 403);
                        }
                    }
                 } catch (\Exception $e) {
                     if ($e->getCode() === 403) throw $e;
                     error_log("Date Error in AuthService: " . $e->getMessage());
                 }
            }
        } else {
            $plan = ($isReseller) ? null : $customer->plan; // Resellers don't use subscription plans
        }
        
        // 2. Platform Access Check: Ensure the user's plan permits access from the current device type
        // Skip for Open Access
        $currentPlatform = $deviceInfo['platform'] ?? 'web';
        if ($plan && !empty($plan->platform_access) && !$isOpenAccess) {
            $allowedPlatforms = $plan->platform_access;
            if (!in_array($currentPlatform, $allowedPlatforms)) {
                throw new Exception("Access denied on {$currentPlatform} platform. Upgrade plan.", 403);
            }
        }

        // 3. Industry-Standard Device Limit System: Only count unique devices (slots)
        $deviceId = $deviceInfo['device_id'] ?? null;
        // Resellers always have device limit of 1
        $deviceLimit = ($customer->role === 'reseller') ? 1 : ($plan ? $plan->device_limit : 1);

        // Slot Reuse: Check if this specific physical device already has an active session slot
        $existingSession = null;
        if ($deviceId) {
            $existingSession = \App\Models\CustomerSession::where('customer_id', $customer->id)
                ->where('device_id', $deviceId)
                ->first();
        }

        // If it's a new device (new slot), verify available device limit
        if (!$existingSession) {
            // STRICT ENFORCEMENT: Count ALL active sessions for this customer.
            // This prevents bypasses from legacy sessions or those without valid device IDs.
            $activeDevicesCount = \App\Models\CustomerSession::where('customer_id', $customer->id)->count();

            if ($activeDevicesCount >= $deviceLimit) {
                // Device limit reached: Return a restricted token for device management (revocation)
                return [
                    'status' => false,
                    'message' => 'Device limit reached. Please manage your devices.',
                    'error' => 'device_limit_reached',
                    'temp_token' => $this->generateRestrictedToken($customer)['token']
                ];
            }
        }

        $this->activityLogger->log($customer->id, 'LOGIN', 'User logged in successfully', $deviceInfo);

        // Pass existing session token if reusing a slot to keep state consistent
        return $this->generateTokens($customer, $deviceInfo, $existingSession ? $existingSession->session_token : null);
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
            $session->customer_id = $customer->id;
            $session->device_id = $deviceInfo['device_id'] ?? null;
            $session->session_token = $jti;
            $session->device_name = $deviceInfo['device_name'] ?? 'Unknown Device';
            $session->platform = $deviceInfo['platform'] ?? 'web';
            $session->ip_address = $deviceInfo['ip_address'] ?? null;
            $session->browser_info = $deviceInfo['user_agent'] ?? null;
            $session->created_at = date('Y-m-d H:i:s');
            $session->last_active = date('Y-m-d H:i:s');
            $session->save();
        } else {
            // Update existing session
            $session = \App\Models\CustomerSession::where('session_token', $jti)->first();
            if ($session) {
                $session->last_active = date('Y-m-d H:i:s');
                $session->device_name = $deviceInfo['device_name'] ?? $session->device_name;
                $session->ip_address = $deviceInfo['ip_address'] ?? $session->ip_address;
                $session->save();
            }
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
                'role' => $customer->role,
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
            'scopes' => ['manage_devices'] // Standardized scope
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
                'role' => $customer->role,
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
                // Fetch customer's plan limit (resellers always have limit of 1)
                $customer->load('plan');
                $deviceLimit = ($customer->role === 'reseller') ? 1 : ($customer->plan ? $customer->plan->device_limit : 1);

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
