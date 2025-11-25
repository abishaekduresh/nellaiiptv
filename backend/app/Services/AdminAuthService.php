<?php

namespace App\Services;

use App\Models\User;
use Firebase\JWT\JWT;
use Ramsey\Uuid\Uuid;
use Exception;

class AdminAuthService
{
    public function login(string $username, string $password): array
    {
        $user = User::where('username', $username)->first();

        if (!$user) {
            throw new Exception('Invalid credentials');
        }

        if (!$user->isActive()) {
            throw new Exception('Account is inactive');
        }

        if (!password_verify($password, $user->password)) {
            throw new Exception('Invalid credentials');
        }

        return $this->generateTokens($user);
    }

    public function refreshToken($tokenData): array
    {
        $user = User::where('uuid', $tokenData->sub)->first();

        if (!$user || !$user->isActive()) {
            throw new Exception('Invalid user');
        }

        return $this->generateTokens($user);
    }

    private function generateTokens(User $user): array
    {
        $issuedAt = time();
        $expire = $issuedAt + (int)$_ENV['JWT_EXPIRATION'];

        $payload = [
            'iss' => $_ENV['APP_URL'],
            'aud' => $_ENV['APP_URL'],
            'iat' => $issuedAt,
            'exp' => $expire,
            'sub' => $user->uuid,
            'role' => $user->role,
            'type' => 'admin'
        ];

        $token = JWT::encode($payload, $_ENV['JWT_SECRET'], 'HS256');

        return [
            'access_token' => $token,
            'token_type' => 'Bearer',
            'expires_in' => (int)$_ENV['JWT_EXPIRATION'],
            'user' => [
                'uuid' => $user->uuid,
                'username' => $user->username,
                'email' => $user->email,
                'role' => $user->role
            ]
        ];
    }
}
