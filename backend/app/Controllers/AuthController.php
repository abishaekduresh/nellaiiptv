<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Services\AuthService;
use App\Helpers\ResponseFormatter;
use App\Helpers\Validator;
use Exception;

class AuthController
{
    private $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    public function register(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody() ?? [];
        
        $errors = Validator::validate($data, [
            'required' => [['name'], ['phone'], ['password'], ['email']],
            'email' => [['email']],
            'lengthMin' => [['password', 6], ['phone', 10]],
            'lengthMax' => [['phone', 10]],
            // Numeric check can also be added if Valitron supports it, but length + UI filter is usually enough
        ]);

        if ($errors) {
            return ResponseFormatter::error($response, 'Validation failed', 400, $errors);
        }

        try {
            $result = $this->authService->register($data);
            return ResponseFormatter::success($response, $result, 'Registration successful. Please login.', 201);
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 400);
        }
    }

    public function login(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody() ?? [];

        $errors = Validator::validate($data, [
            'required' => [['phone'], ['password']]
        ]);

        if ($errors) {
            return ResponseFormatter::error($response, 'Validation failed', 400, $errors);
        }

        // Extract device info from headers or body
        $ipAddress = $request->getAttribute('ip_address') ?? $_SERVER['REMOTE_ADDR'] ?? null;
        $deviceInfo = [
            'device_name' => $data['device_name'] ?? $request->getHeaderLine('User-Agent'),
            'user_agent' => $request->getHeaderLine('User-Agent'),
            'platform' => $request->getHeaderLine('X-Client-Platform') ?: 'web',
            'ip_address' => $ipAddress
        ];

        try {
            $result = $this->authService->login($data['phone'], $data['password'], $deviceInfo);
            
            // Check if it's a restricted token response
            if (isset($result['status']) && $result['status'] === false) {
                 return ResponseFormatter::error(
                     $response, 
                     $result['message'], 
                     403, 
                     ['error' => $result['error'], 'temp_token' => $result['temp_token']]
                 );
            }

            return ResponseFormatter::success($response, $result, 'Login successful');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 401);
        }
    }

    public function getSessions(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');
        
        try {
            $sessions = $this->authService->getSessions($user->sub);
            return ResponseFormatter::success($response, $sessions, 'Active sessions retrieved');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }

    public function revokeSession(Request $request, Response $response, string $id): Response
    {
        $user = $request->getAttribute('user');
        $sessionId = (int)$id;
        $data = $request->getParsedBody() ?? [];
        
        // Extract device info (same as login logic)
        $ipAddress = $request->getAttribute('ip_address') ?? $_SERVER['REMOTE_ADDR'] ?? null;
        $deviceInfo = [
            'device_name' => $data['device_name'] ?? $request->getHeaderLine('User-Agent'),
            'user_agent' => $request->getHeaderLine('User-Agent'),
            'platform' => $request->getHeaderLine('X-Client-Platform') ?: 'web',
            'ip_address' => $ipAddress
        ];

        // Check if auto-login is requested (only for restricted device page)
        $attemptAutoLogin = filter_var($request->getQueryParams()['auto_login'] ?? false, FILTER_VALIDATE_BOOLEAN);

        try {
            $result = $this->authService->revokeSession($user->sub, $sessionId, $deviceInfo, $attemptAutoLogin);
            
            if ($result['success']) {
                $responseData = null;
                $message = 'Session revoked successfully';
                
                if (isset($result['tokens'])) {
                    $responseData = ['tokens' => $result['tokens']];
                    $message .= '. You have been logged in.';
                }
                
                return ResponseFormatter::success($response, $responseData, $message);
            }
            return ResponseFormatter::error($response, 'Session not found or could not be revoked', 404);
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }

    public function logout(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');
        $jti = $user->jti ?? null;
        
        // Extract device info for logging
        $ipAddress = $request->getAttribute('ip_address') ?? $_SERVER['REMOTE_ADDR'] ?? null;
        $deviceInfo = [
            'user_agent' => $request->getHeaderLine('User-Agent'),
            'ip_address' => $ipAddress,
            'platform' => $request->getHeaderLine('X-Client-Platform') ?: 'web'
        ];

        try {
            if ($jti) {
                $this->authService->logout($user->sub, $jti, $deviceInfo);
            }
            return ResponseFormatter::success($response, null, 'Logged out successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }

    public function refreshToken(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');

        try {
            $result = $this->authService->refreshToken($user);
            return ResponseFormatter::success($response, $result, 'Token refreshed successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 401);
        }
    }
    
    public function forgotPassword(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody() ?? [];
        
        $errors = Validator::validate($data, [
            'required' => [['email']],
            'email' => [['email']]
        ]);

        if ($errors) {
            return ResponseFormatter::error($response, 'Validation failed', 400, $errors);
        }

        try {
            $this->authService->forgotPassword($data['email']);
            return ResponseFormatter::success($response, null, 'Password reset link has been sent to your email');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 400);
        }
    }

    public function resetPassword(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody() ?? [];

        $errors = Validator::validate($data, [
            'required' => [['token'], ['password']],
            'lengthMin' => [['password', 6]]
        ]);

        if ($errors) {
            return ResponseFormatter::error($response, 'Validation failed', 400, $errors);
        }

        try {
            $this->authService->resetPassword($data['token'], $data['password']);
            return ResponseFormatter::success($response, null, 'Password has been reset successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 400);
        }
    }
}
