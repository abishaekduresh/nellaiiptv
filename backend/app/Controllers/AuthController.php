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

        try {
            $result = $this->authService->login($data['phone'], $data['password']);
            return ResponseFormatter::success($response, $result, 'Login successful');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 401);
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
