<?php

namespace App\Controllers\Admin;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Services\AdminAuthService;
use App\Helpers\ResponseFormatter;
use App\Helpers\Validator;
use Exception;

class AdminAuthController
{
    private $authService;

    public function __construct(AdminAuthService $authService)
    {
        $this->authService = $authService;
    }

    public function login(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody() ?? [];

        $errors = Validator::validate($data, [
            'required' => [['username'], ['password']]
        ]);

        if ($errors) {
            return ResponseFormatter::error($response, 'Validation failed', 400, $errors);
        }

        try {
            $result = $this->authService->login($data['username'], $data['password']);
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
            return ResponseFormatter::success($response, $result, 'Token refreshed');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 401);
        }
    }
}
