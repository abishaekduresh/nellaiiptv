<?php

namespace App\Services;

use App\Models\Customer;
use Firebase\JWT\JWT;
use Ramsey\Uuid\Uuid;
use Exception;

class AuthService
{
    public function register(array $data): array
    {
        if (Customer::where('phone', $data['phone'])->exists()) {
            throw new Exception('Phone number already registered');
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

    public function login(string $phone, string $password): array
    {
        $customer = Customer::where('phone', $phone)->first();

        if (!$customer || !password_verify($password, $customer->password)) {
            throw new Exception('Invalid credentials');
        }

        if ($customer->status !== 'active') {
            throw new Exception('Account is not active');
        }

        return $this->generateTokens($customer);
    }

    public function refreshToken(object $user): array
    {
        $customer = Customer::where('uuid', $user->sub)->first();
        
        if (!$customer || $customer->status !== 'active') {
            throw new Exception('Invalid user');
        }

        return $this->generateTokens($customer);
    }

    private function generateTokens(Customer $customer): array
    {
        $issuedAt = time();
        $expirationTime = $issuedAt + $_ENV['JWT_EXPIRATION'];
        $payload = [
            'iss' => $_ENV['APP_URL'],
            'sub' => $customer->uuid,
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
