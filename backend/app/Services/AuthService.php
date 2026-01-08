<?php

namespace App\Services;

use App\Models\Customer;
use App\Services\ActivityLogger; // Added
use Firebase\JWT\JWT;
use Ramsey\Uuid\Uuid;
use Exception;

class AuthService
{
    private $jwtSecret; // Added
    private $activityLogger; // Added

    public function __construct(ActivityLogger $activityLogger) // Added constructor
    {
        $this->activityLogger = $activityLogger;
        $this->jwtSecret = $_ENV['API_SECRET']; // Use API_SECRET as JWT secret
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
        $customer = Customer::where('phone', $phone)->first();

        if (!$customer || !password_verify($password, $customer->password)) {
            throw new Exception('Invalid credentials');
        }

        if ($customer->status !== 'active') {
            throw new Exception('Account is not active');
        }

        // Check active sessions using ID
        $activeSessions = \App\Models\CustomerSession::where('customer_id', $customer->id)->count();
        $deviceLimit = 1; // Default limit

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
                $deviceLimit = 1;

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

    public function forgotPassword(string $email): bool
    {
        $customer = Customer::where('email', $email)->first();

        if (!$customer) {
            // Return true to prevent email enumeration
            return true;
        }

        $token = bin2hex(random_bytes(32));
        $customer->reset_token = $token;
        $customer->reset_token_expiry = date('Y-m-d H:i:s', strtotime('+1 hour'));
        $customer->save();

        // In a real app, send email here
        // Mail::to($email)->send(new ResetPasswordEmail($token));
        // For now, we'll just log it or assume it's sent
        error_log("Reset token for {$email}: {$token}");

        return true;
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
